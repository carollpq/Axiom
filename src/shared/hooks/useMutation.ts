"use client";

import { useState, useCallback, useRef } from "react";

interface UseMutationOptions<TData> {
  url: string | (() => string);
  method?: string;
  onSuccess?: (data: TData) => void;
  onError?: (error: string) => void;
}

interface UseMutationReturn<TVars> {
  mutate: (body?: TVars) => Promise<void>;
  isLoading: boolean;
}

export function useMutation<TData = unknown, TVars = unknown>({
  url,
  method = "POST",
  onSuccess,
  onError,
}: UseMutationOptions<TData>): UseMutationReturn<TVars> {
  const [isLoading, setIsLoading] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const mutate = useCallback(
    async (body?: TVars) => {
      setIsLoading(true);
      try {
        const resolvedUrl = typeof url === "function" ? url() : url;
        const response = await fetch(resolvedUrl, {
          method,
          headers: { "Content-Type": "application/json" },
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Unknown error" }));
          const msg = (err as { error?: string }).error ?? "Request failed";
          onErrorRef.current?.(msg);
          console.error(`[useMutation] ${resolvedUrl} error:`, msg);
          return;
        }

        const data = (await response.json().catch(() => ({}))) as TData;
        onSuccessRef.current?.(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unexpected error";
        onErrorRef.current?.(msg);
        console.error(`[useMutation] Unexpected error:`, err);
      } finally {
        setIsLoading(false);
      }
    },
    [url, method],
  );

  return { mutate, isLoading };
}
