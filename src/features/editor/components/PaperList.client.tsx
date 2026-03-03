"use client";

import type { PaperCardData } from "@/src/features/editor/types";
import { PaperListItem } from "./PaperListItem";

interface PaperListProps {
  papers: PaperCardData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  sectionTitle?: string;
}

export function PaperList({ papers, selectedId, onSelect, sectionTitle }: PaperListProps) {
  return (
    <div>
      {sectionTitle && (
        <div
          className="px-4 py-3"
          style={{ borderBottom: "1px solid rgba(120,110,95,0.12)" }}
        >
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px]">
            {sectionTitle}
          </div>
          <div className="font-serif text-[13px] text-[#8a8070] mt-0.5">
            {papers.length} {papers.length === 1 ? "paper" : "papers"}
          </div>
        </div>
      )}

      {papers.length === 0 ? (
        <div className="p-6 text-center text-[#6a6050] font-serif text-sm">
          No papers in this stage.
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
