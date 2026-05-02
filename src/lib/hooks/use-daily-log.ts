"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import type { DailyLogRow, DailyLogNodeRow } from "@/lib/supabase/types";
import type { DailyLog, DailyLogNode } from "@/lib/types";

function nodesFromRow(raw: unknown): DailyLogNode[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((n) => {
    const node = n as Partial<DailyLogNodeRow>;
    return {
      id: typeof node.id === "string" ? node.id : crypto.randomUUID(),
      title: typeof node.title === "string" ? node.title : "",
      children: nodesFromRow(node.children),
    };
  });
}

function rowToLog(r: DailyLogRow | null, clientId: string): DailyLog {
  if (!r) {
    return {
      id: clientId,
      date: new Date().toISOString().split("T")[0],
      timeIn: "",
      timeOut: "",
      tasksCompleted: [],
      pendingTasks: [],
      priorities: [],
      blockers: [],
      nextDayPlan: [],
    };
  }
  return {
    id: r.client_id,
    date: r.log_date,
    timeIn: r.time_in ?? "",
    timeOut: r.time_out ?? "",
    tasksCompleted: nodesFromRow(r.tasks_completed),
    pendingTasks: nodesFromRow(r.pending_tasks),
    priorities: nodesFromRow(r.priorities),
    blockers: nodesFromRow(r.blockers),
    nextDayPlan: nodesFromRow(r.next_day_plan),
  };
}

export function useDailyLog(clientId: string | null) {
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) { setLog(null); setLoading(false); return; }
    const cid = clientId;
    let cancelled = false;

    async function fetchOne() {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("client_id", cid)
        .maybeSingle();
      if (cancelled) return;
      if (error) { setError(error.message); setLoading(false); return; }
      setLog(rowToLog((data as DailyLogRow | null) ?? null, cid));
      setLoading(false);
    }

    fetchOne();

    const channel = supabase
      .channel(`daily-log-${clientId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "daily_logs", filter: `client_id=eq.${clientId}` },
        () => fetchOne())
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [clientId]);

  return { log, loading, error };
}
