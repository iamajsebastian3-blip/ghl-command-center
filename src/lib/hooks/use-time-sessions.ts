"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import type { TimeSessionRow } from "@/lib/supabase/types";

export interface TimeSession {
  id: string;
  date: string;       // YYYY-MM-DD
  start: string;      // local 12-hour time label
  end: string;
  startEpoch: number;
  seconds: number;
}

function rowToSession(r: TimeSessionRow): TimeSession {
  return {
    id: r.id,
    date: r.session_date,
    start: r.start_label,
    end: r.end_label,
    startEpoch: r.start_epoch,
    seconds: r.seconds,
  };
}

export function useTimeSessions(clientId: string | null) {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) { setSessions([]); setLoading(false); return; }
    let cancelled = false;

    async function fetchAll() {
      const { data, error } = await supabase
        .from("time_sessions")
        .select("*")
        .eq("client_id", clientId)
        .order("start_epoch", { ascending: false });
      if (cancelled) return;
      if (error) { setError(error.message); setLoading(false); return; }
      setSessions(((data ?? []) as TimeSessionRow[]).map(rowToSession));
      setLoading(false);
    }

    fetchAll();

    const channel = supabase
      .channel(`time-sessions-${clientId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "time_sessions", filter: `client_id=eq.${clientId}` },
        () => fetchAll())
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [clientId]);

  return { sessions, loading, error };
}
