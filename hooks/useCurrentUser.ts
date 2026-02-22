"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { fetchApi } from "@/lib/api";

export interface DbUser {
  id: string;
  walletAddress: string;
  did: string | null;
  displayName: string | null;
  institution: string | null;
  orcidId: string | null;
  roles: string[];
  researchFields: string[];
}

export function useCurrentUser() {
  const account = useActiveAccount();
  const [user, setUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!account?.address) {
      setUser(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchApi<DbUser>(`/api/auth/me?wallet=${account.address}`)
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

  return {
    account,
    user,
    loading,
    isConnected: !!account?.address,
  };
}
