"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { createClient as dbCreateClient, deleteClient as dbDeleteClient, type CreateClientInput } from "@/lib/db/clients";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export interface CreateClientFormInput {
  name: string;
  company: string;
  slug?: string;
  industry?: string;
  status?: "Active" | "Onboarding" | "Paused";
  engagement?: "Full-time" | "Part-time" | "Project-based";
  schedule?: string;
  rate?: number;
  rateLabel?: string;
  brandColor?: string;
}

export async function createClientAction(input: CreateClientFormInput) {
  await requireOwner();

  const name = input.name?.trim();
  const company = input.company?.trim();
  if (!name || !company) {
    return { ok: false as const, error: "Name and company are required" };
  }

  const slug = (input.slug?.trim() || slugify(`${company}-${name}`)) || slugify(name);
  if (!slug) {
    return { ok: false as const, error: "Could not derive a URL slug from the name/company" };
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || name.slice(0, 2).toUpperCase();

  const payload: CreateClientInput = {
    slug,
    name,
    company,
    industry: input.industry?.trim() || undefined,
    status: input.status ?? "Active",
    engagement: input.engagement ?? "Full-time",
    schedule: input.schedule?.trim() || undefined,
    rate: input.rate,
    rateLabel: input.rateLabel?.trim() || (input.rate ? `₱${input.rate.toLocaleString()}/mo` : undefined),
    joinedDate: new Date().toISOString().slice(0, 10),
    avatar: initials,
    brandColor: input.brandColor || undefined,
  };

  try {
    const row = await dbCreateClient(payload);
    revalidatePath("/");
    return { ok: true as const, client: row };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.toLowerCase().includes("duplicate") || message.includes("unique")) {
      return { ok: false as const, error: `A client with slug "${slug}" already exists` };
    }
    return { ok: false as const, error: message };
  }
}

export async function deleteClientAction(id: string) {
  await requireOwner();
  try {
    await dbDeleteClient(id);
    revalidatePath("/");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
