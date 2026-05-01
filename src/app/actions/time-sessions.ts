"use server";

import { requireOwner } from "@/lib/auth";
import { createTimeSession, deleteTimeSession } from "@/lib/db/time-sessions";
import type { TimeSessionInsert } from "@/lib/supabase/types";

export async function createTimeSessionAction(input: TimeSessionInsert) {
  await requireOwner();
  try {
    const row = await createTimeSession(input);
    return { ok: true as const, session: row };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteTimeSessionAction(id: string) {
  await requireOwner();
  try {
    await deleteTimeSession(id);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
