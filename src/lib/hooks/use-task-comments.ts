"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import type { TaskComment, CommentAttachment } from "@/lib/types";
import type { TaskCommentRow, CommentAttachmentRow } from "@/lib/supabase/types";

type Joined = TaskCommentRow & { comment_attachments: CommentAttachmentRow[] };

function rowToAttachment(r: CommentAttachmentRow): CommentAttachment {
  return {
    id: r.id,
    type: r.type,
    url: r.url,
    label: r.label ?? undefined,
    filename: r.filename ?? undefined,
    size: r.size ?? undefined,
    mimeType: r.mime_type ?? undefined,
  };
}

function rowToComment(r: Joined): TaskComment {
  return {
    id: r.id,
    taskId: r.task_id,
    author: r.author,
    body: r.body,
    createdAt: new Date(r.created_at).getTime(),
    attachments: (r.comment_attachments ?? []).map(rowToAttachment),
  };
}

export function useTaskComments(clientId: string | null) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setComments([]);
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function fetchAll() {
      const { data, error } = await supabase
        .from("task_comments")
        .select("*, comment_attachments(*), tasks!inner(client_id)")
        .eq("tasks.client_id", clientId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setComments(((data ?? []) as Joined[]).map(rowToComment));
      setLoading(false);
    }

    fetchAll();

    // Refetch on any change to comments or attachments. Filtering in realtime
    // doesn't support joins, so we just refetch and let the query filter.
    const channel = supabase
      .channel(`comments-${clientId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_comments" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "comment_attachments" }, () => fetchAll())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  return { comments, loading, error };
}
