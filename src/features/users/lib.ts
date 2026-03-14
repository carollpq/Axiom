import type { Role } from '@/src/features/auth/types';
import type { UserProfile } from '@/src/shared/types/shared';
import { getInitials, truncate } from '@/src/shared/lib/format';

/** Display name with wallet fallback. */
export function displayNameOrWallet(
  name: string | null | undefined,
  wallet: string,
): string {
  return name ?? truncate(wallet);
}

/** Build a UserProfile from a DB user (or raw wallet) and the current role. */
export function buildUserProfile(
  wallet: string,
  user: {
    displayName: string | null;
    walletAddress: string;
    roles: string[];
  } | null,
  role: Role,
): UserProfile {
  return {
    displayName: user?.displayName ?? null,
    initials: getInitials(user?.displayName ?? wallet),
    wallet: truncate(user?.walletAddress ?? wallet),
    role,
    roles: (user?.roles ?? [role]) as Role[],
  };
}
