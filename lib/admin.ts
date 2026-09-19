// Admin access is a fixed allowlist of Clerk user ids, not a role stored
// anywhere a signed-in advertiser could reach or influence — anyone on
// this list can create ad_slots for ANY advertiser_id, so keep it short
// and keep the env var itself out of client-exposed config.
function adminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return adminUserIds().includes(userId);
}
