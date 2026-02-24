"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { fetchApi } from "@/lib/api";
import { doLogout } from "@/src/app/actions/auth";
import type { DbUser } from "@/src/shared/types/api";

interface UserContextValue {
  account: ReturnType<typeof useActiveAccount>;
  user: DbUser | null;
  loading: boolean;
  isConnected: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const [user, setUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(false);

  // Restore session on mount (page refresh, SSR rehydration)
  useEffect(() => {
    setLoading(true);
    fetchApi<DbUser>("/api/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // React to wallet connect/disconnect
  useEffect(() => {
    if (!account?.address) {
      doLogout().then(() => setUser(null));
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchApi<DbUser>("/api/auth/me")
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
  }, [account?.address]);

  return (
    <UserContext.Provider
      value={{ account, user, loading, isConnected: !!account?.address }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
