import { createClient } from "@supabase/supabase-js";

// Browser-side Supabase client. Uses the anon (public) key.
// RLS policies in supabase/schema.sql restrict this to SELECT only.
// All writes must go through server actions in lib/supabase/server.ts.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 5 } },
});
