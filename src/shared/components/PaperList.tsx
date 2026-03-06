"use client";

import { PaperListItem } from "./PaperListItem";
import type { PaperListItemData } from "./PaperListItem";

interface PaperListProps {
  papers: PaperListItemData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
}

export function PaperList({ papers, selectedId, onSelect, emptyMessage = "No papers found." }: PaperListProps) {
  return (
    <div>
      {papers.length === 0 ? (
        <div className="p-6 text-center text-[#6a6050] font-serif text-sm">
          {emptyMessage}
        </div>
      ) : (
        papers.map((paper) => (
          <PaperListItem
            key={paper.id}
            paper={paper}
            selected={selectedId === paper.id}
            onClick={() => onSelect(paper.id)}
          />
        ))
      )}
    </div>
  );
}
