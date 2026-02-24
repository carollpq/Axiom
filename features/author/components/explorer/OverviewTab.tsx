import type { ExplorerPaper } from "@/features/author/types/explorer";

interface OverviewTabProps {
  paper: ExplorerPaper;
}

const sectionStyle: React.CSSProperties = {
  background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.15)",
  borderRadius: 8, padding: 22, marginBottom: 20,
};

export function OverviewTab({ paper }: OverviewTabProps) {
  return (
    <div>
      {/* Authors & Contributions */}
      <div style={sectionStyle}>
        <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3.5">Authors & Contributions</div>
        {paper.authors.map((a, i) => (
          <div
            key={i}
            className="flex justify-between items-center py-2.5"
            style={{ borderBottom: i < paper.authors.length - 1 ? "1px solid rgba(120,110,95,0.08)" : "none" }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#d4ccc0]">{a.name}</span>
                <span className="text-[10px] text-[#7a9fc7] cursor-pointer">ORCID: {a.orcid} {"\u2197"}</span>
              </div>
              <div className="text-[11px] text-[#6a6050] mt-0.5">{a.role}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-[60px] h-1 rounded-sm overflow-hidden" style={{ background: "rgba(120,110,95,0.15)" }}>
                <div className="h-full rounded-sm bg-[#c9b89e]" style={{ width: a.pct + "%" }} />
              </div>
              <span className="text-sm text-[#c9b89e] font-sans font-semibold min-w-[36px] text-right">{a.pct}%</span>
            </div>
          </div>
        ))}
        <div className="mt-3 text-[10px] text-[#5a7a9a] font-mono cursor-pointer">
          Contract: {paper.contractHash.slice(0, 8)}...{paper.contractHash.slice(-4)} {"\u2022"} View on Hedera {"\u2197"}
        </div>
      </div>

      {/* Abstract */}
      <div style={sectionStyle}>
        <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3">Abstract</div>
        <div className="text-[13px] text-[#b0a898] leading-[1.7]">{paper.abstract}</div>
        {paper.visibility === "public" && (
          <button
            className="mt-3.5 rounded py-2 px-[18px] text-[#c9b89e] text-xs cursor-pointer font-serif"
            style={{ background: "none", border: "1px solid rgba(180,160,120,0.25)" }}
          >View Full Paper {"\u2197"}</button>
        )}
        {paper.visibility === "private" && (
          <div className="mt-3.5 text-[11px] text-[#6a6050] italic">
            Content is private. Hash recorded on-chain for proof of disclosure.
          </div>
        )}
      </div>
    </div>
  );
}
