import type { PaperUnderReview } from "@/src/features/reviewer/types";

interface PaperPanelProps {
  paper: PaperUnderReview;
}

export function PaperPanel({ paper }: PaperPanelProps) {
  return (
    <div
      className="rounded-lg p-6 mb-6"
      style={{
        background: "linear-gradient(145deg, rgba(45,42,38,0.9), rgba(35,32,28,0.9))",
        border: "1px solid rgba(120,110,95,0.25)",
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h2 className="text-xl font-serif font-normal m-0" style={{ color: "#e8e0d4" }}>
            {paper.title}
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs" style={{ color: "#8a8070" }}>{paper.journal}</span>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                background: "rgba(130,160,200,0.15)",
                color: "#7a9fc7",
                border: "1px solid rgba(130,160,200,0.3)",
              }}
            >
              {paper.version}
            </span>
            {paper.anonymized && (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: "rgba(143,188,143,0.12)",
                  color: "#8fbc8f",
                  border: "1px solid rgba(143,188,143,0.3)",
                }}
              >
                Double-Blind
              </span>
            )}
          </div>
        </div>
        <a
          href={paper.pdfUrl}
          className="text-xs px-4 py-2 rounded no-underline font-serif"
          style={{
            background: "rgba(201,164,74,0.15)",
            color: "#c9a44a",
            border: "1px solid rgba(201,164,74,0.3)",
          }}
        >
          View Full Paper
        </a>
      </div>

      <div
        className="text-sm leading-relaxed"
        style={{ color: "#b0a898" }}
      >
        {paper.abstract}
      </div>
    </div>
  );
}
