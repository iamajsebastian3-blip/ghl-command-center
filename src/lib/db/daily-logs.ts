import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { DailyLogRow, DailyLogUpsert } from "@/lib/supabase/types";

export async function getDailyLog(clientId: string): Promise<DailyLogRow | null> {
  const { data, error } = await supabaseAdmin
    .from("daily_logs")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as DailyLogRow | null;
}

export async function upsertDailyLog(input: DailyLogUpsert): Promise<DailyLogRow> {
  const payload = { ...input, updated_at: new Date().toISOString() };
  const { data, error } = await supabaseAdmin
    .from("daily_logs")
    .upsert(payload, { onConflict: "client_id" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DailyLogRow;
}
