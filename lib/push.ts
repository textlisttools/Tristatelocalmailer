import webpush from "web-push";
import { supabaseAdmin } from "./supabase-server";

webpush.setVapidDetails(
  "mailto:hello@tristatelocalmailer.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

// Sends a push notification to every device an advertiser has
// installed the app / enabled notifications on. Fire-and-forget from
// the caller's perspective — a failed send for one device should
// never block or fail the scan-logging request that triggered it.
export async function notifyAdvertiser(
  advertiserId: string,
  payload: PushPayload
) {
  const supabase = supabaseAdmin();

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("advertiser_id", advertiserId);

  if (error || !subscriptions?.length) return;

  const staleIds: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        // 404/410 means the browser unsubscribed or the subscription
        // expired — clean it up so future sends don't keep failing on it.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          staleIds.push(sub.id);
        }
      }
    })
  );

  if (staleIds.length) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }
}
