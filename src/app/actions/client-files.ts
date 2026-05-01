"use server";

import { requireOwner } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createClientFile, deleteClientFile } from "@/lib/db/client-files";
import type { ClientFileRow } from "@/lib/supabase/types";

const STORAGE_BUCKET = "client-files";
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

function inferType(name: string, mime: string): ClientFileRow["type"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) return "image";
  if (mime === "application/pdf" || ["pdf", "doc", "docx", "txt"].includes(ext)) return "pdf";
  if (mime.startsWith("video/") || ["mp4", "mov", "avi", "webm"].includes(ext)) return "video";
  return "other";
}

function inferCategory(type: ClientFileRow["type"]): ClientFileRow["category"] {
  if (type === "image") return "Images";
  if (type === "pdf") return "Documents";
  if (type === "video") return "Videos";
  return "Other";
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function uploadClientFileAction(formData: FormData) {
  await requireOwner();

  const clientId = formData.get("clientId");
  const category = formData.get("category");
  const notes = (formData.get("notes") as string | null) ?? "";

  if (typeof clientId !== "string" || !clientId) {
    return { ok: false as const, error: "Missing clientId" };
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false as const, error: "No files to upload" };

  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) {
      return { ok: false as const, error: `"${f.name}" exceeds 25 MB limit` };
    }
  }

  try {
    for (const file of files) {
      const path = `${clientId}/${Date.now()}-${safeFilename(file.name)}`;
      const upload = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upload.error) {
        return { ok: false as const, error: `Upload failed: ${upload.error.message}` };
      }
      const { data: pub } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      const type = inferType(file.name, file.type);
      const cat = (typeof category === "string" && category) ? category as ClientFileRow["category"] : inferCategory(type);
      await createClientFile({
        client_id: clientId,
        name: file.name,
        category: cat,
        type,
        url: pub.publicUrl,
        thumbnail: type === "image" ? pub.publicUrl : null,
        size_label: humanSize(file.size),
        notes: notes.trim(),
        storage_path: path,
      });
    }
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function addClientFileLinkAction(input: {
  clientId: string;
  name: string;
  category: ClientFileRow["category"];
  type: ClientFileRow["type"];
  url: string;
  notes?: string;
}) {
  await requireOwner();
  if (!input.name?.trim()) return { ok: false as const, error: "Name is required" };
  try {
    await createClientFile({
      client_id: input.clientId,
      name: input.name.trim(),
      category: input.category,
      type: input.type,
      url: input.url.trim(),
      size_label: "—",
      notes: input.notes?.trim() ?? "",
    });
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteClientFileAction(id: string) {
  await requireOwner();
  try {
    const { storage_path } = await deleteClientFile(id);
    if (storage_path) {
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([storage_path]);
    }
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
