import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ClientFileRow, ClientFileInsert } from "@/lib/supabase/types";

export async function listClientFiles(clientId: string): Promise<ClientFileRow[]> {
  const { data, error } = await supabaseAdmin
    .from("client_files")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientFileRow[];
}

export async function createClientFile(input: ClientFileInsert): Promise<ClientFileRow> {
  const { data, error } = await supabaseAdmin
    .from("client_files")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ClientFileRow;
}

export async function deleteClientFile(id: string): Promise<{ storage_path: string | null }> {
  const { data, error } = await supabaseAdmin
    .from("client_files")
    .delete()
    .eq("id", id)
    .select("storage_path")
    .single();
  if (error) throw new Error(error.message);
  return { storage_path: (data?.storage_path as string | null) ?? null };
}
