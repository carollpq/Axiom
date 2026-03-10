'use client';

// Backwards-compatible alias so existing hooks don't need updating all at once.
export { useUser as useCurrentUser } from '@/src/shared/context/user-context.client';
export type { User } from '@/src/shared/types/domain';
