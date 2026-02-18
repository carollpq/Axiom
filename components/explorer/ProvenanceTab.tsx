import type { ExplorerPaper } from "@/types/explorer";
import { HashRow } from "./HashRow";

interface ProvenanceTabProps {
  paper: ExplorerPaper;
}

export function ProvenanceTab({ paper }: ProvenanceTabProps) {
  const nodes = [
    { label: "Paper", connected: true },
    { label: "Dataset", connected: !!paper.datasetHash },
    { label: "Code", connected: !!paper.codeCommit },
    { label: "Environment", connected: !!paper.envHash },
  ];

  return (
    <div
      className="rounded-lg p-[22px]"
      style={{ background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.15)" }}
    >
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-4">On-Chain Provenance</div>

      {/* Visual graph */}
      <div
        className="flex items-center justify-center gap-3 p-5 mb-5 rounded-md"
        style={{ background: "rgba(30,28,24,0.4)", border: "1px solid rgba(120,110,95,0.08)" }}
      >
        {nodes.map((n, i, arr) => (
          <div key={i} className="flex items-center">
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-[13px]"
                style={{
                  background: n.connected ? "rgba(120,180,120,0.1)" : "rgba(120,110,95,0.08)",
                  border: "2px solid " + (n.connected ? "rgba(120,180,120,0.3)" : "rgba(120,110,95,0.15)"),
                  color: n.connected ? "#8fbc8f" : "#4a4238",
                }}
              >{n.connected ? "\u2713" : "\u2013"}</div>
              <div
                className="text-[10px] mt-1.5 uppercase tracking-[0.5px]"
                style={{ color: n.connected ? "#8fbc8f" : "#4a4238" }}
              >{n.label}</div>
            </div>
            {i < arr.length - 1 && (
              <div className="w-[30px] h-0.5 mx-1 mb-5" style={{ background: "rgba(120,110,95,0.15)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Hash rows */}
      <HashRow label="Paper Hash" hash={paper.paperHash} />
      <HashRow label="Dataset Hash" hash={paper.datasetHash} url={paper.datasetUrl} />
      <HashRow label="Code Commit" hash={paper.codeCommit} url={paper.codeUrl} />
      <HashRow label="Environment Hash" hash={paper.envHash} />
      <HashRow label="Contract Hash" hash={paper.contractHash} />

      {/* Footer note */}
      <div
        className="mt-4 py-2.5 px-3.5 rounded text-[11px] text-[#6a6050] leading-relaxed"
        style={{ background: "rgba(120,180,120,0.04)", border: "1px solid rgba(120,180,120,0.1)" }}
      >
        All hashes are immutably recorded on Hedera and independently verifiable. Click &quot;Verify&quot; on any hash to view its transaction on the Hedera explorer.
      </div>
    </div>
  );
}
