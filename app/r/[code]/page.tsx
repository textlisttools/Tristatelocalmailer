import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";
import { hashIp } from "@/lib/ip-hash";
import { deviceTypeFromUserAgent } from "@/lib/device";
import { geoFromHeaders } from "@/lib/geo";
import { notifyAdvertiser } from "@/lib/push";
import { OfferForm } from "./OfferForm";

export const dynamic = "force-dynamic";

// The link printed as a QR code on the postcard: /r/<code>. Logs the scan,
// then shows a hosted opt-in page (OfferForm) instead of redirecting
// straight to the advertiser's site — that way an advertiser never has to
// add anything to their own page to capture a lead.
export default async function ScanPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = supabaseAdmin();

  const { data: adSlot } = await supabase
    .from("ad_slots")
    .select("id, advertiser_id, business_name, destination_url, status")
    .eq("code", code)
    .maybeSingle();

  if (!adSlot || adSlot.status !== "active") {
    redirect("/code-not-found");
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const geo = geoFromHeaders(headersList);

  const { data: scan } = await supabase
    .from("scans")
    .insert({
      ad_slot_id: adSlot.id,
      ip_hash: hashIp(ip),
      device_type: deviceTypeFromUserAgent(headersList.get("user-agent")),
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

  // Tolerate a destination_url saved without a scheme (e.g. "www.example.com"
  // instead of "https://www.example.com") — an easy mistake to make when
  // adding ad_slots by hand in the Supabase table editor.
  let destination: string;
  try {
    const raw = adSlot.destination_url;
    destination = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).toString();
  } catch {
    redirect("/code-not-found");
  }

  return (
    <OfferForm
      adSlotId={adSlot.id}
      scanId={scan?.id ?? null}
      businessName={adSlot.business_name}
      destinationUrl={destination}
    />
  );
}
