"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import type { ClientRow } from "@/lib/supabase/types";
import type { Client } from "@/lib/types";

function rowToClient(r: ClientRow): Client {
  return {
    id: r.id,
    name: r.name,
    company: r.company,
    industry: r.industry ?? "",
    status: (r.status as Client["status"]) ?? "Active",
    engagement: (r.engagement as Client["engagement"]) ?? "Full-time",
    schedule: r.schedule ?? "",
    rate: r.rate ?? 0,
    rateLabel: r.rate_label ?? "",
    joinedDate: r.joined_date ?? "",
    avatar: r.avatar ?? r.name.slice(0, 2).toUpperCase(),
    image: r.image ?? undefined,
    logo: r.logo ?? undefined,
    brandColor: r.brand_color ?? undefined,
  };
}

export interface ClientWithSlug extends Client {
  slug: string;
}

export function useClients() {
  const [clients, setClients] = useState<ClientWithSlug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const rows = (data ?? []) as ClientRow[];
      setClients(rows.map((r) => ({ ...rowToClient(r), slug: r.slug })));
      setLoading(false);
    }

    fetchAll();

    const channel = supabase
      .channel("clients-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => {
        fetchAll();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { clients, loading, error };
}
