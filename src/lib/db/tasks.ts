import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { TaskRow, TaskInsert, TaskUpdate } from "@/lib/supabase/types";

export async function listTasks(clientId: string): Promise<TaskRow[]> {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TaskRow[];
}

export async function createTask(input: TaskInsert): Promise<TaskRow> {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as TaskRow;
}

export async function updateTask(id: string, patch: TaskUpdate): Promise<TaskRow> {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as TaskRow;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAllTasksForClient(clientId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("tasks").delete().eq("client_id", clientId);
  if (error) throw new Error(error.message);
}
