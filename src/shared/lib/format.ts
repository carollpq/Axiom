import type { Role } from "@/src/features/auth/types";
import type { UserProfile } from "@/src/shared/types/shared";

export function truncateHash(hash: string, prefixLen = 6): string {
  return hash.length > 12 ? `${hash.slice(0, prefixLen)}...${hash.slice(-4)}` : hash;
}

export function truncateWallet(addr: string, prefixLen = 6): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, prefixLen)}...${addr.slice(-4)}`;
}

export function getInitials(name: string): string {
  if (name.startsWith("0x")) return name.slice(2, 4).toUpperCase();
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "1 month ago";
  return `${Math.floor(diffDays / 30)} months ago`;
}

/** ISO date string → "YYYY-MM-DD" */
export function formatIsoDate(iso: string): string {
  return iso.slice(0, 10);
}

/** Capitalize the first letter of a string. */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Display name with wallet fallback. */
export function displayNameOrWallet(
  name: string | null | undefined,
  wallet: string,
): string {
  return name ?? truncateWallet(wallet);
}

/** Build a UserProfile from a DB user (or raw wallet) and the current role. */
export function buildUserProfile(
  wallet: string,
  user: { displayName: string | null; walletAddress: string; roles: string[] } | null,
  role: Role,
): UserProfile {
  return {
    displayName: user?.displayName ?? null,
    initials: getInitials(user?.displayName ?? wallet),
    wallet: truncateWallet(user?.walletAddress ?? wallet),
    role,
    roles: (user?.roles ?? [role]) as Role[],
  };
}

/** Generate a mock transaction hash for demo/dev mode. */
export function mockTxHash(): string {
  return (
    "0x" +
    Math.random().toString(16).slice(2, 10) +
    "..." +
    Math.random().toString(16).slice(2, 6)
  );
}

/** Convert a 0–100 score to a 0.0–5.0 display scale. */
export function toFivePointScale(score100: number): number {
  return Math.round((score100 / 20) * 10) / 10;
}

/** Format an ISO timestamp as "YYYY-MM-DD HH:MM:SS UTC" */
export function formatTimestampUtc(iso: string): string {
  return iso.replace("T", " ").slice(0, 19) + " UTC";
}