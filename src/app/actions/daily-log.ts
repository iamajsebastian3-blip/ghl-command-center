"use server";

import { requireOwner } from "@/lib/auth";
import { upsertDailyLog } from "@/lib/db/daily-logs";
import type { DailyLogUpsert } from "@/lib/supabase/types";

export async function upsertDailyLogAction(input: DailyLogUpsert) {
  await requireOwner();
  if (!input.client_id) return { ok: false as const, error: "Missing client_id" };
  try {
    await upsertDailyLog(input);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
