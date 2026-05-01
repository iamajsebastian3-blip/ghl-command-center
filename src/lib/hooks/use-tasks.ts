"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import type { TaskRow } from "@/lib/supabase/types";
import type { Task } from "@/lib/types";

function rowToTask(r: TaskRow): Task {
  return {
    id: r.id,
    name: r.name,
    status: r.status,
    priority: r.priority,
  };
}

export function useTasks(clientId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function fetchAll() {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setTasks(((data ?? []) as TaskRow[]).map(rowToTask));
      setLoading(false);
    }

    fetchAll();

    const channel = supabase
      .channel(`tasks-${clientId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `client_id=eq.${clientId}` },
        () => {
          fetchAll();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  return { tasks, loading, error };
}
