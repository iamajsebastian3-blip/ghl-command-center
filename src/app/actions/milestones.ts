"use server";

import { requireOwner } from "@/lib/auth";
import { upsertMilestone, updateMilestone, deleteMilestone } from "@/lib/db/milestones";
import type { MilestoneInsert, MilestoneRow } from "@/lib/supabase/types";

export async function upsertMilestoneAction(input: MilestoneInsert & { id?: string }) {
  await requireOwner();
  try {
    const row = await upsertMilestone(input);
    return { ok: true as const, milestone: row as MilestoneRow };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function toggleMilestoneStepAction(milestoneId: string, stepId: string) {
  await requireOwner();
  try {
    // Refetch to apply mutation atomically — small data, low contention
    const { supabaseAdmin } = await import("@/lib/supabase/server");
    const { data, error } = await supabaseAdmin
      .from("milestones")
      .select("steps")
      .eq("id", milestoneId)
      .single();
    if (error) throw new Error(error.message);
    const steps = (data?.steps as { id: string; label: string; done: boolean }[] | null) ?? [];
    const next = steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s));
    const doneCount = next.filter((s) => s.done).length;
    let status: MilestoneRow["status"] = "Not Started";
    if (doneCount === next.length && next.length > 0) status = "Completed";
    else if (doneCount > 0) status = "In Progress";
    await updateMilestone(milestoneId, { steps: next, status });
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteMilestoneAction(id: string) {
  await requireOwner();
  try {
    await deleteMilestone(id);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
