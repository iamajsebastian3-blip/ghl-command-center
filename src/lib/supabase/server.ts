import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using service_role.
// This key bypasses RLS — never import from client components or pass to the browser.
// "server-only" makes any accidental client import a build error.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
