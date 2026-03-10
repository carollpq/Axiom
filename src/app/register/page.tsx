'use client';

import { AuthPageShell } from '@/src/features/auth/components/auth-page-shell.client';
import { Registration } from '@/src/features/auth/components/registration.client';

export default function RegisterPage() {
  return (
    <AuthPageShell>
      <Registration />
    </AuthPageShell>
  );
}
