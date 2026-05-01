import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { MilestoneRow, MilestoneInsert, MilestoneUpdate } from "@/lib/supabase/types";

export async function listMilestones(clientId: string): Promise<MilestoneRow[]> {
  const { data, error } = await supabaseAdmin
    .from("milestones")
    .select("*")
    .eq("client_id", clientId)
    .order("position", { ascending: true })
    .order("number", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as MilestoneRow[];
}

export async function upsertMilestone(input: MilestoneInsert & { id?: string }): Promise<MilestoneRow> {
  const payload = { ...input, updated_at: new Date().toISOString() };
  const { data, error } = await supabaseAdmin
    .from("milestones")
    .upsert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MilestoneRow;
}

export async function updateMilestone(id: string, patch: MilestoneUpdate): Promise<MilestoneRow> {
  const { data, error } = await supabaseAdmin
    .from("milestones")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MilestoneRow;
}

export async function deleteMilestone(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("milestones").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
