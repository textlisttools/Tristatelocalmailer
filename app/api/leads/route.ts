import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { notifyAdvertiser } from "@/lib/push";

type LeadPayload = {
  scan_id?: string;
  ad_slot_id?: string;
  name?: string;
  email?: string;
  phone?: string;
};

// Called by app/r/[code]/OfferForm.tsx, the hosted opt-in page a visitor
// lands on after scanning. Uses the service-role client because the
// visitor submitting it isn't authenticated at all.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as LeadPayload | null;

  if (!body?.ad_slot_id || (!body.email && !body.phone)) {
    return NextResponse.json(
      { error: "ad_slot_id and at least one of email/phone are required" },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  const { data: adSlot } = await supabase
    .from("ad_slots")
    .select("id, advertiser_id, business_name")
    .eq("id", body.ad_slot_id)
    .maybeSingle();

  if (!adSlot) {
    return NextResponse.json({ error: "Unknown ad_slot_id" }, { status: 404 });
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      ad_slot_id: adSlot.id,
      scan_id: body.scan_id ?? null,
      name: body.name?.trim() || null,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: "Could not save lead" }, { status: 500 });
  }

  await notifyAdvertiser(adSlot.advertiser_id, {
    title: adSlot.business_name,
    body: "You've got a new lead from your ad code.",
    url: "/dashboard",
  });

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
