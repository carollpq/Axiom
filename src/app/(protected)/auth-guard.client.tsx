'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/src/shared/context/user-context.client';
import { ROUTES } from '@/src/shared/lib/routes';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isConnected, loading } = useUser();

  useEffect(() => {
    if (!loading && !isConnected) {
      router.push(ROUTES.login);
    }
  }, [loading, isConnected, router]);

  // Still resolving wallet state — show nothing to avoid dashboard flash
  if (loading || !isConnected) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#1a1816' }}
      />
    );
  }

  return <>{children}</>;
}
