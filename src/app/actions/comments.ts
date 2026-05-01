"use server";

import { requireOwner } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getClientBySlug } from "@/lib/db/clients";
import {
  insertComment,
  insertAttachment,
  deleteComment as dbDeleteComment,
} from "@/lib/db/comments";

const STORAGE_BUCKET = "task-attachments";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB — DB storage is fine with this
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/gif", "image/webp"];

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

type CommentPayload = {
  taskId: string;
  body: string;
  urls: { url: string; label?: string }[];
  files: File[];
};

function parsePayload(formData: FormData): CommentPayload | { error: string } {
  const taskId = formData.get("taskId");
  const body = (formData.get("body") as string | null) ?? "";
  const urlsRaw = (formData.get("urls") as string | null) ?? "[]";

  if (typeof taskId !== "string" || !taskId) return { error: "Missing taskId" };

  let urls: { url: string; label?: string }[] = [];
  try {
    const parsed = JSON.parse(urlsRaw);
    if (Array.isArray(parsed)) urls = parsed.filter((u) => u && typeof u.url === "string");
  } catch {
    return { error: "Invalid urls payload" };
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (!body.trim() && urls.length === 0 && files.length === 0) {
    return { error: "Comment cannot be empty" };
  }

  for (const file of files) {
    if (!ALLOWED_MIME.includes(file.type)) {
      return { error: `Unsupported image type: ${file.type}` };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: `Image "${file.name}" is over 5 MB` };
    }
  }

  return { taskId, body: body.trim(), urls, files };
}

async function persistComment(
  payload: CommentPayload,
  author: "you" | "client",
) {
  const comment = await insertComment({ task_id: payload.taskId, author, body: payload.body });

  for (const u of payload.urls) {
    const trimmed = u.url.trim();
    if (!trimmed) continue;
    await insertAttachment({
      comment_id: comment.id,
      type: "url",
      url: trimmed,
      label: u.label?.trim() || null,
    });
  }

  for (const file of payload.files) {
    const path = `${payload.taskId}/${comment.id}/${Date.now()}-${safeFilename(file.name)}`;
    const upload = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) {
      throw new Error(`Upload failed: ${upload.error.message}`);
    }
    const { data: pub } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    await insertAttachment({
      comment_id: comment.id,
      type: "image",
      url: pub.publicUrl,
      filename: file.name,
      size: file.size,
      mime_type: file.type,
    });
  }
}

export async function addCommentAction(formData: FormData) {
  await requireOwner();

  const author = formData.get("author");
  if (author !== "you" && author !== "client") {
    return { ok: false as const, error: "Invalid author" };
  }

  const parsed = parsePayload(formData);
  if ("error" in parsed) return { ok: false as const, error: parsed.error };

  try {
    await persistComment(parsed, author);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// Public client action: anyone with the share URL (slug) can post a comment as the client.
// We verify the slug exists AND the targeted task belongs to that slug — so a leaked URL
// can't be used to post against another client's tasks.
export async function addClientCommentAction(formData: FormData) {
  const slug = formData.get("slug");
  if (typeof slug !== "string" || !slug) {
    return { ok: false as const, error: "Missing slug" };
  }

  const parsed = parsePayload(formData);
  if ("error" in parsed) return { ok: false as const, error: parsed.error };

  try {
    const client = await getClientBySlug(slug);
    if (!client) return { ok: false as const, error: "Unknown client" };

    const { data: task, error: taskErr } = await supabaseAdmin
      .from("tasks")
      .select("id, client_id")
      .eq("id", parsed.taskId)
      .maybeSingle();
    if (taskErr) return { ok: false as const, error: taskErr.message };
    if (!task || task.client_id !== client.id) {
      return { ok: false as const, error: "Task does not belong to this client" };
    }

    await persistComment(parsed, "client");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteCommentAction(id: string) {
  await requireOwner();
  try {
    await dbDeleteComment(id);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
