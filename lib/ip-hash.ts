import { createHmac } from "crypto";

// Hashes a visitor's IP with a server-only salt so scans can be
// deduped/rate-limited without ever storing the raw IP address — see
// docs/privacy-policy.md.
export function hashIp(ip: string): string {
  return createHmac("sha256", process.env.IP_HASH_SALT!).update(ip).digest("hex");
}
