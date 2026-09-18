export type Geo = {
  city: string | null;
  region: string | null;
  country: string | null;
};

// City/region-level only, per docs/privacy-policy.md — never a precise
// address. Reads the geo headers Vercel's edge network attaches to every
// request; falls back to nulls when not running on Vercel (e.g. local dev).
export function geoFromHeaders(headers: Headers): Geo {
  return {
    city: headers.get("x-vercel-ip-city"),
    region: headers.get("x-vercel-ip-country-region"),
    country: headers.get("x-vercel-ip-country"),
  };
}
