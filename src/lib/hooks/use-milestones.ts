"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import type { MilestoneRow } from "@/lib/supabase/types";
import type { Milestone } from "@/lib/types";

function rowToMilestone(r: MilestoneRow): Milestone {
  return {
    id: r.id,
    number: r.number,
    title: r.title,
    targetDate: r.target_date ?? "",
    intent: r.intent,
    output: r.output,
    status: r.status,
    steps: Array.isArray(r.steps) ? r.steps : [],
  };
}

export function useMilestones(clientId: string | null) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) { setMilestones([]); setLoading(false); return; }
    let cancelled = false;

    async function fetchAll() {
      const { data, error } = await supabase
        .from("milestones")
        .select("*")
        .eq("client_id", clientId)
        .order("position", { ascending: true })
        .order("number", { ascending: true });
      if (cancelled) return;
      if (error) { setError(error.message); setLoading(false); return; }
      setMilestones(((data ?? []) as MilestoneRow[]).map(rowToMilestone));
      setLoading(false);
    }

    fetchAll();

    const channel = supabase
      .channel(`milestones-${clientId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "milestones", filter: `client_id=eq.${clientId}` },
        () => fetchAll())
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [clientId]);

  return { milestones, loading, error };
}
