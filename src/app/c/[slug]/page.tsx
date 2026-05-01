import { notFound } from "next/navigation";
import { getClientBySlug } from "@/lib/db/clients";
import PublicClientView from "./public-client-view";
import type { Client } from "@/lib/types";

// Public read-only client view. No passcode. RLS allows anon to SELECT only.
export const dynamic = "force-dynamic";

export default async function ClientPublicPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const row = await getClientBySlug(slug);
  if (!row) notFound();

  const client: Client = {
    id: row.id,
    name: row.name,
    company: row.company,
    industry: row.industry ?? "",
    status: (row.status as Client["status"]) ?? "Active",
    engagement: (row.engagement as Client["engagement"]) ?? "Full-time",
    schedule: row.schedule ?? "",
    rate: row.rate ?? 0,
    rateLabel: row.rate_label ?? "",
    joinedDate: row.joined_date ?? "",
    avatar: row.avatar ?? row.name.slice(0, 2).toUpperCase(),
    image: row.image ?? undefined,
    logo: row.logo ?? undefined,
    brandColor: row.brand_color ?? undefined,
  };

  return <PublicClientView client={client} slug={slug} />;
}
