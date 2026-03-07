"use client";

import { useState, useMemo } from "react";

export function useSelection<T extends { id: string }>(items: T[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  return { selectedId, setSelectedId, selected };
}
