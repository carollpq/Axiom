"use client";

import type { PaperCardData } from "@/src/shared/types/editor-dashboard";
import { PaperListItem } from "./PaperListItem";

interface PaperListProps {
  papers: PaperCardData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PaperList({ papers, selectedId, onSelect }: PaperListProps) {
  if (papers.length === 0) {
    return (
      <div className="p-6 text-center text-[#6a6050] font-serif text-sm">
        No papers in this stage.
      </div>
    );
  }

  return (
    <div>
      {papers.map((paper) => (
        <PaperListItem
          key={paper.id}
          paper={paper}
          selected={selectedId === paper.id}
          onClick={() => onSelect(paper.id)}
        />
      ))}
    </div>
  );
}
