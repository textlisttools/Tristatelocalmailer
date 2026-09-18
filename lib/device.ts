import type { DeviceType } from "@/types/database";

// Deliberately coarse: advertiser reporting only needs a mobile / tablet /
// desktop split, not full user-agent parsing.
export function deviceTypeFromUserAgent(userAgent: string | null): DeviceType {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/ipad|(?:tablet)(?!.*mobile)/.test(ua)) return "tablet";
  if (/mobi|iphone|android/.test(ua)) return "mobile";
  if (/mozilla|chrome|safari|firefox|edge/.test(ua)) return "desktop";
  return "unknown";
}
