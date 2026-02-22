"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/context/UserContext";

/**
 * Fetch data that requires an authenticated session (JWT cookie).
 * Handles: connected-check, cancellation, loading state, error reset.
 *
 * @param fetcher  Function that returns a Promise<T>. Cookies are sent automatically.
 *                 Must be stable (wrap in useCallback) or pass deps explicitly.
 * @param deps     Extra dependency values that re-trigger the fetch when changed.
 */
export function useAuthFetch<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): { data: T | null; loading: boolean; refetch: () => Promise<T | null> } {
  const { user, isConnected } = useUser();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  // Keep a stable ref to the fetcher so the effect dep array stays minimal
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const runFetch = useCallback(async (signal: { cancelled: boolean }): Promise<T | null> => {
    setLoading(true);
    try {
      const result = await fetcherRef.current();
      if (!signal.cancelled) setData(result);
      return result;
    } catch {
      if (!signal.cancelled) setData(null);
      return null;
    } finally {
      if (!signal.cancelled) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isConnected || !user) {
      setData(null);
      return;
    }

    const signal = { cancelled: false };
    runFetch(signal);

    return () => {
      signal.cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, user, runFetch, ...deps]);

  const refetch = useCallback(async (): Promise<T | null> => {
    if (!isConnected || !user) return null;
    const signal = { cancelled: false };
    return runFetch(signal);
  }, [isConnected, user, runFetch]);

  return { data, loading, refetch };
}
