import type { PaperVersion } from "@/types/explorer";

interface VersionsTabProps {
  versions: PaperVersion[];
}

function getVersionColor(label: string): string {
  if (label === "Published") return "#8fbc8f";
  if (label === "Retracted") return "#d4645a";
  if (label === "Submitted") return "#c9b458";
  return "#9a9aad";
}

export function VersionsTab({ versions }: VersionsTabProps) {
  return (
    <div
      className="rounded-lg p-[22px]"
      style={{ background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.15)" }}
    >
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-5">Version History</div>

      <div className="relative pl-7">
        <div
          className="absolute w-0.5 left-[9px] top-2.5 bottom-2.5"
          style={{ background: "rgba(120,110,95,0.15)" }}
        />
        {versions.map((v, i) => {
          const isLatest = i === versions.length - 1;
          const vColor = getVersionColor(v.label);
          return (
            <div key={i} className="relative mb-6">
              {/* Timeline dot */}
              <div
                className="absolute -left-7 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                style={{
                  background: isLatest
                    ? (v.label === "Retracted" ? "rgba(200,100,90,0.2)" : "rgba(120,180,120,0.2)")
                    : "rgba(120,110,95,0.1)",
                  border: "2px solid " + (isLatest ? vColor : "rgba(120,110,95,0.2)"),
                  color: vColor,
                }}
              >{isLatest ? (v.label === "Retracted" ? "\u2715" : "\u2713") : ""}</div>

              {/* Content */}
              <div
                className="py-3.5 px-[18px] rounded-md"
                style={{
                  background: isLatest ? "rgba(120,110,95,0.06)" : "transparent",
                  border: "1px solid " + (isLatest ? "rgba(120,110,95,0.15)" : "rgba(120,110,95,0.06)"),
                }}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm text-[#d4ccc0] font-semibold">{v.v}</span>
                    <span
                      className="text-[10px] py-0.5 px-2 rounded-sm"
                      style={{
                        background: "rgba(120,110,95,0.1)",
                        color: vColor,
                        border: "1px solid rgba(120,110,95,0.15)",
                      }}
                    >{v.label}</span>
                  </div>
                  <span className="text-[11px] text-[#6a6050]">{v.date}</span>
                </div>
                {v.note && <div className="text-[11px] text-[#8a8070] mb-1">{v.note}</div>}
                <div className="text-[10px] text-[#5a7a9a] font-mono">Hash: {v.hash}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
