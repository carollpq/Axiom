'use client';

import { createContext, use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'thirdweb/react';
import { fetchApi } from '@/src/shared/lib/api';
import { doLogout } from '@/src/shared/lib/auth/actions';
import type { DbUser } from '@/src/shared/types/api';

interface UserContextValue {
  account: ReturnType<typeof useActiveAccount>;
  user: DbUser | null;
  loading: boolean;
  isConnected: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const account = useActiveAccount();
  const [user, setUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Track whether the wallet has resolved at least once so we don't
  // mistake the initial undefined (Thirdweb rehydrating) for a disconnect.
  const walletReady = useRef(false);

  // Restore session on mount (page refresh, SSR rehydration)
  useEffect(() => {
    let cancelled = false;
    fetchApi<DbUser>('/api/auth/me')
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // React to wallet connect/disconnect
  useEffect(() => {
    if (!account?.address) {
      // Still waiting for Thirdweb to rehydrate the wallet — don't log out yet.
      if (!walletReady.current) return;
      doLogout().then(() => {
        setUser(null);
        router.push('/login');
      });
      return;
    }

    walletReady.current = true;

    let cancelled = false;

    // Set loading via microtask to satisfy react-hooks/set-state-in-effect
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });

    fetchApi<DbUser>('/api/auth/me')
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [account?.address, router]);

  return (
    <UserContext.Provider
      value={{ account, user, loading, isConnected: !!account?.address }}
    >
      {children}
    </UserContext.Provider>
  );
}

/**
 * Use this hook for all authenticated UI inside (protected)/ routes.
 * It wraps Thirdweb's useActiveAccount() and adds:
 *  - `user`        — DB record (role, ORCID, display name)
 *  - `loading`     — true while the session is still rehydrating
 *  - `isConnected` — safe wallet-connected flag (false during rehydration)
 *
 * Only use useActiveAccount() directly in code that runs OUTSIDE
 * UserProvider (login, registration) or inside UserProvider itself.
 */
export function useUser(): UserContextValue {
  const ctx = use(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
