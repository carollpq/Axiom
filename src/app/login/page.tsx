import { AuthPageShell } from '@/src/features/auth/components/auth-page-shell';
import { Login } from '@/src/features/auth/components/login.client';

export default function LoginPage() {
  return (
    <AuthPageShell>
      <Login />
    </AuthPageShell>
  );
}
