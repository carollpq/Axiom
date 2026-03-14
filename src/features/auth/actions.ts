'use server';

import { requireSession } from '@/src/shared/lib/auth/auth';
import { registerUserRole } from '@/src/features/users/mutations';
import { ROLES, type Role } from '@/src/features/auth/types';

/** Validates ORCID ID against the public API before persisting role + profile. */
export async function updateProfileAction(input: {
  role: string;
  orcidId: string;
  displayName: string;
}) {
  const wallet = await requireSession();

  if (!ROLES.includes(input.role as Role)) {
    throw new Error('Invalid role');
  }

  // Validate ORCID ID using the ORCID public API
  const orcidApiUrl = `https://pub.orcid.org/v3.0/${encodeURIComponent(input.orcidId)}`;
  const orcidRes = await fetch(orcidApiUrl, {
    headers: { Accept: 'application/json' },
    method: 'GET',
  });
  if (!orcidRes.ok) {
    throw new Error('ORCID ID not found or invalid');
  }

  if (typeof input.displayName !== 'string' || !input.displayName.trim()) {
    throw new Error('Display name is required');
  }

  await registerUserRole(
    wallet,
    input.role as Role,
    input.orcidId,
    input.displayName.trim(),
  );

  return { message: 'User registered successfully' };
}
