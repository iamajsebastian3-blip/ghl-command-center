import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ClientRow, ClientInsert } from "@/lib/supabase/types";

export async function listClients(): Promise<ClientRow[]> {
  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientRow[];
}

export async function getClientBySlug(slug: string): Promise<ClientRow | null> {
  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as ClientRow | null;
}

export interface CreateClientInput {
  slug: string;
  name: string;
  company: string;
  industry?: string;
  status?: "Active" | "Onboarding" | "Paused";
  engagement?: "Full-time" | "Part-time" | "Project-based";
  schedule?: string;
  rate?: number;
  rateLabel?: string;
  joinedDate?: string;
  avatar?: string;
  image?: string;
  logo?: string;
  brandColor?: string;
}

export async function createClient(input: CreateClientInput): Promise<ClientRow> {
  const insert: ClientInsert = {
    slug: input.slug,
    name: input.name,
    company: input.company,
    industry: input.industry ?? null,
    status: input.status ?? "Active",
    engagement: input.engagement ?? "Full-time",
    schedule: input.schedule ?? null,
    rate: input.rate ?? null,
    rate_label: input.rateLabel ?? null,
    joined_date: input.joinedDate ?? null,
    avatar: input.avatar ?? null,
    image: input.image ?? null,
    logo: input.logo ?? null,
    brand_color: input.brandColor ?? null,
  };
  const { data, error } = await supabaseAdmin
    .from("clients")
    .insert(insert)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ClientRow;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
