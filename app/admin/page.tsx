import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AdminClient } from "./AdminClient";
import type { AdSlot } from "@/types/database";

export type AdvertiserOption = {
  id: string;
  label: string;
};

// middleware.ts requires a signed-in session to reach /admin at all, but
// only the allowlist in lib/admin.ts should actually get in — anyone else
// gets bounced back to their own dashboard.
export default async function AdminPage() {
  const { userId } = await auth();
  if (!isAdmin(userId)) {
    redirect("/dashboard");
  }

  const supabase = supabaseAdmin();
  const { data: adSlotsData } = await supabase
    .from("ad_slots")
    .select("*")
    .order("created_at", { ascending: false });

  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({ limit: 100 });
  const advertisers: AdvertiserOption[] = users.map((user) => ({
    id: user.id,
    label: user.primaryEmailAddress?.emailAddress ?? user.fullName ?? user.id,
  }));

  return (
    <AdminClient adSlots={(adSlotsData ?? []) as AdSlot[]} advertisers={advertisers} />
  );
}
