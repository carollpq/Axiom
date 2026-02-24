import type { ExplorerPaper } from "@/features/author/types/explorer";

interface RetractionBannerProps {
  paper: ExplorerPaper;
}

export function RetractionBanner({ paper }: RetractionBannerProps) {
  if (!paper.retracted) return null;

  return (
    <div
      className="py-4 px-5 mb-5 rounded-md"
      style={{ background: "rgba(200,100,90,0.1)", border: "1px solid rgba(200,100,90,0.3)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg text-[#d4645a]">{"\u26A0"}</span>
        <span className="text-[15px] text-[#d4645a] font-semibold">This paper has been retracted</span>
      </div>
      <div className="text-xs text-[#b08070] leading-relaxed mb-2">{paper.retractionReason}</div>
      <div className="flex gap-5 text-[11px] text-[#8a6050]">
        <span>Requesting party: {paper.retractionParty}</span>
        <span>Failed component: {paper.retractionComponent}</span>
      </div>
      <div className="text-[10px] text-[#5a7a9a] font-mono mt-2 cursor-pointer">View retraction on-chain {"\u2197"}</div>
    </div>
  );
}
