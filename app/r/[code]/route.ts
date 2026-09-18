import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { hashIp } from "@/lib/ip-hash";
import { deviceTypeFromUserAgent } from "@/lib/device";
import { geoFromHeaders } from "@/lib/geo";
import { notifyAdvertiser } from "@/lib/push";

export const dynamic = "force-dynamic";

// The link printed as a QR code on the postcard: /r/<code>. Logs the scan,
// then 302s the visitor on to the advertiser's own destination page with
// scan_id attached so an opt-in submitted there (components/OptInForm.tsx)
// links back to this scan.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = supabaseAdmin();

  const { data: adSlot } = await supabase
    .from("ad_slots")
    .select("id, advertiser_id, business_name, destination_url, status")
    .eq("code", code)
    .maybeSingle();

  if (!adSlot || adSlot.status !== "active") {
    return NextResponse.redirect(new URL("/code-not-found", request.url));
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const geo = geoFromHeaders(request.headers);

  const { data: scan } = await supabase
    .from("scans")
    .insert({
      ad_slot_id: adSlot.id,
      ip_hash: hashIp(ip),
      device_type: deviceTypeFromUserAgent(request.headers.get("user-agent")),
      city: geo.city,
      region: geo.region,
      country: geo.country,
    })
    .select("id")
    .single();

  // notifyAdvertiser() already swallows per-device send failures, so this
  // never throws — awaiting it just makes sure it actually runs before the
  // serverless function exits, without ever delaying past a normal request.
  await notifyAdvertiser(adSlot.advertiser_id, {
    title: adSlot.business_name,
    body: "Someone just scanned your ad code.",
    url: "/dashboard",
  });

  const destination = new URL(adSlot.destination_url);
  if (scan?.id) destination.searchParams.set("scan_id", scan.id);

  return NextResponse.redirect(destination);
}
