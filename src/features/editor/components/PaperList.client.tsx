"use client";

import { PaperList as SharedPaperList } from "@/src/shared/components/PaperList";
import type { PaperCardData } from "@/src/features/editor/types";

interface PaperListProps {
  papers: PaperCardData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PaperList({ papers, selectedId, onSelect }: PaperListProps) {
  return (
    <SharedPaperList
      papers={papers}
      selectedId={selectedId}
      onSelect={onSelect}
      emptyMessage="No papers in this stage."
    />
  );
}
