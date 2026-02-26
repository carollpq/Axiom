import type { ExplorerPaper } from "@/src/features/researcher/types/explorer";
import { StatusBadge } from "./StatusBadge";

interface DetailHeaderProps {
  paper: ExplorerPaper;
}

export function DetailHeader({ paper }: DetailHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5 mb-2.5">
        <StatusBadge status={paper.status} />
        {paper.journal && <span className="text-xs text-[#8a8070]">{paper.journal}</span>}
      </div>
      <h1
        className="text-2xl font-normal italic m-0 leading-[1.4]"
        style={{
          color: paper.retracted ? "#8a6050" : "#e8e0d4",
          textDecoration: paper.retracted ? "line-through" : "none",
        }}
      >{paper.title}</h1>
      <div className="mt-2.5 text-[11px] text-[#5a7a9a] font-mono">
        Registered: {paper.regTimestamp} {"\u2022"} Tx: {paper.txHash} {"\u2197"}
      </div>
    </div>
  );
}
