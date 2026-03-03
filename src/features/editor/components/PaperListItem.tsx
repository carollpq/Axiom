import type { PaperCardData } from "@/src/features/editor/types";

interface PaperListItemProps {
  paper: PaperCardData;
  selected: boolean;
  onClick: () => void;
}

export function PaperListItem({ paper, selected, onClick }: PaperListItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 transition-colors"
      style={{
        background: selected ? "rgba(45,42,38,0.8)" : "transparent",
        borderLeft: selected ? "3px solid #c9a44a" : "3px solid transparent",
        borderBottom: "1px solid rgba(120,110,95,0.1)",
      }}
    >
      <div className="font-serif text-sm text-[#e8e0d4] mb-1 leading-snug">
        {paper.title}
      </div>
      <div className="text-[11px] text-[#8a8070] mb-2">{paper.authors}</div>
      <div className="text-[11px] text-[#6a6050] leading-relaxed line-clamp-3">
        {paper.abstractSnippet}
      </div>
    </button>
  );
}
