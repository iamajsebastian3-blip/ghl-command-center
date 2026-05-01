import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type {
  TaskCommentRow,
  TaskCommentInsert,
  CommentAttachmentRow,
  CommentAttachmentInsert,
} from "@/lib/supabase/types";

export interface CommentWithAttachments extends TaskCommentRow {
  attachments: CommentAttachmentRow[];
}

// Fetch all comments + attachments for tasks owned by a given client.
export async function listCommentsForClient(clientId: string): Promise<CommentWithAttachments[]> {
  const { data, error } = await supabaseAdmin
    .from("task_comments")
    .select("*, comment_attachments(*), tasks!inner(client_id)")
    .eq("tasks.client_id", clientId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  type Joined = TaskCommentRow & { comment_attachments: CommentAttachmentRow[] };
  return ((data ?? []) as Joined[]).map((row) => {
    const { comment_attachments, ...rest } = row;
    return { ...rest, attachments: comment_attachments ?? [] };
  });
}

export async function insertComment(input: TaskCommentInsert): Promise<TaskCommentRow> {
  const { data, error } = await supabaseAdmin
    .from("task_comments")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as TaskCommentRow;
}

export async function insertAttachment(input: CommentAttachmentInsert): Promise<CommentAttachmentRow> {
  const { data, error } = await supabaseAdmin
    .from("comment_attachments")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CommentAttachmentRow;
}

export async function deleteComment(id: string): Promise<void> {
  // Cascade deletes attachments via foreign key on comment_attachments.
  const { error } = await supabaseAdmin.from("task_comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
