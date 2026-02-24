import type { ExplorerPaper } from "@/src/features/author/types/explorer";
import { StatusBadge } from "./StatusBadge";

interface PaperCardProps {
  paper: ExplorerPaper;
  onSelect: (id: number) => void;
}

export function PaperCard({ paper: p, onSelect }: PaperCardProps) {
  return (
    <div
      onClick={() => onSelect(p.id)}
      className="py-[18px] px-[22px] rounded-md cursor-pointer transition-all duration-200"
      style={{
        background: "rgba(45,42,38,0.4)",
        border: "1px solid rgba(120,110,95,0.12)",
        borderLeft: p.retracted ? "3px solid #d4645a" : "3px solid transparent",
      }}
    >
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="flex-1">
          <div className="text-[15px] text-[#e8e0d4] leading-[1.4] mb-1.5">{p.title}</div>
          <div className="text-xs text-[#8a8070]">
            {p.authors.map(a => a.name).join(", ")}
          </div>
        </div>
        <StatusBadge status={p.status} />
      </div>
      <div className="flex gap-4 items-center flex-wrap">
        <span className="text-[11px] text-[#6a6050]">{p.journal}</span>
        <span className="text-[11px] text-[#4a4238]">{"\u2022"}</span>
        <span className="text-[11px] text-[#6a6050]">{p.field}</span>
        <span className="text-[11px] text-[#4a4238]">{"\u2022"}</span>
        <span className="text-[11px] text-[#6a6050]">{p.date}</span>
        <span className="text-[11px] text-[#4a4238]">{"\u2022"}</span>
        <span className="text-[10px] text-[#5a7a9a] font-mono">{p.txHash}</span>
        <span className="text-[10px] text-[#8fbc8f]">{"\u2713"} Verified</span>
      </div>
    </div>
  );
}
