import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/browser";

// GET /api/supabase-health — quick smoke test for env vars + connection + RLS read.
// Visit in dev to verify your Supabase setup before building the rest.

export async function GET() {
  try {
    const { data, error, count } = await supabase
      .from("clients")
      .select("id, slug, name", { count: "exact" })
      .limit(5);

    if (error) {
      return NextResponse.json(
        { ok: false, where: "select clients", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      clientCount: count,
      sampleClients: data,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, where: "client init", error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
