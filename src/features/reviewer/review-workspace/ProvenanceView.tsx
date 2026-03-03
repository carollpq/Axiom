import type { ProvenanceEntry } from "@/src/features/reviewer/types";

interface ProvenanceViewProps {
  provenance: ProvenanceEntry[];
}

export function ProvenanceView({ provenance }: ProvenanceViewProps) {
  return (
    <div
      className="rounded-lg p-5 mb-6"
      style={{
        background: "rgba(45,42,38,0.5)",
        border: "1px solid rgba(120,110,95,0.15)",
      }}
    >
      <div
        className="text-xs uppercase mb-4"
        style={{ color: "#6a6050", letterSpacing: 1.5 }}
      >
        Provenance Chain
      </div>
      <div className="flex flex-col gap-2">
        {provenance.map((entry, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2 rounded"
            style={{ background: "rgba(30,28,24,0.5)" }}
          >
            <span
              className="text-xs w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                background: entry.verified
                  ? "rgba(143,188,143,0.2)"
                  : "rgba(200,160,90,0.2)",
                color: entry.verified ? "#8fbc8f" : "#d4a45a",
              }}
            >
              {entry.verified ? "\u2713" : "?"}
            </span>
            <span className="text-xs w-28 flex-shrink-0" style={{ color: "#8a8070" }}>
              {entry.label}
            </span>
            <span
              className="text-xs flex-1 truncate"
              style={{ color: "#6a6050", fontFamily: "monospace" }}
            >
              {entry.hash}
            </span>
            {entry.url && (
              <a
                href={entry.url}
                className="text-xs no-underline flex-shrink-0"
                style={{ color: "#5a7a9a" }}
              >
                View Source
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
