"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import type { ClientFileRow } from "@/lib/supabase/types";
import type { FileItem } from "@/lib/types";

function rowToFile(r: ClientFileRow): FileItem {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    type: r.type,
    url: r.url,
    thumbnail: r.thumbnail ?? undefined,
    size: r.size_label,
    uploadedAt: r.created_at.split("T")[0],
    notes: r.notes,
  };
}

export function useClientFiles(clientId: string | null) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) { setFiles([]); setLoading(false); return; }
    let cancelled = false;

    async function fetchAll() {
      const { data, error } = await supabase
        .from("client_files")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) { setError(error.message); setLoading(false); return; }
      setFiles(((data ?? []) as ClientFileRow[]).map(rowToFile));
      setLoading(false);
    }

    fetchAll();

    const channel = supabase
      .channel(`client-files-${clientId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "client_files", filter: `client_id=eq.${clientId}` },
        () => fetchAll())
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [clientId]);

  return { files, loading, error };
}
