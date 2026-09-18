import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client scoped to the signed-in advertiser, via
// Clerk's native Supabase integration (Clerk issues the JWT, Supabase
// verifies it and resolves auth.uid() to the Clerk user id). Reads through
// this client are constrained by the RLS policies in supabase/schema.sql —
// it uses the anon key, never the service-role key.
export async function supabaseForAdvertiser() {
  const { getToken } = await auth();
  const token = await getToken();

  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    auth: { persistSession: false },
  });
}
