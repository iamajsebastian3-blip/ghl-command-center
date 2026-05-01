import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { TimeSessionRow, TimeSessionInsert } from "@/lib/supabase/types";

export async function listTimeSessions(clientId: string): Promise<TimeSessionRow[]> {
  const { data, error } = await supabaseAdmin
    .from("time_sessions")
    .select("*")
    .eq("client_id", clientId)
    .order("start_epoch", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TimeSessionRow[];
}

export async function createTimeSession(input: TimeSessionInsert): Promise<TimeSessionRow> {
  const { data, error } = await supabaseAdmin
    .from("time_sessions")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as TimeSessionRow;
}

export async function deleteTimeSession(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("time_sessions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
