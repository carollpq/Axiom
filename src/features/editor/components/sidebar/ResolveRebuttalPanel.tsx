"use client";

import { useState } from "react";
import type { RebuttalResolutionDb } from "@/src/shared/lib/db/schema";

interface RebuttalResponseView {
  reviewId: string;
  reviewerLabel: string;
  position: "agree" | "disagree";
  justification: string;
}

interface ResolveRebuttalPanelProps {
  responses: RebuttalResponseView[];
  rebuttalId: string;
  onResolve: (resolution: RebuttalResolutionDb, notes: string) => void;
  isResolving: boolean;
}

const positionColors = {
  agree: { bg: "rgba(120,180,120,0.15)", text: "#8fbc8f", border: "rgba(120,180,120,0.3)" },
  disagree: { bg: "rgba(200,100,90,0.15)", text: "#d4645a", border: "rgba(200,100,90,0.3)" },
};

export function ResolveRebuttalPanel({
  responses,
  rebuttalId,
  onResolve,
  isResolving,
}: ResolveRebuttalPanelProps) {
  const [resolution, setResolution] = useState<RebuttalResolutionDb | "">("");
  const [notes, setNotes] = useState("");

  return (
    <div
      className="p-4"
      style={{ borderBottom: "1px solid rgba(120,110,95,0.1)" }}
    >
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3">
        Rebuttal Responses
      </div>

      <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
        {responses.map((r) => {
          const c = positionColors[r.position];
          return (
            <div
              key={`${r.reviewId}-${r.position}`}
              className="rounded p-3"
              style={{
                background: "rgba(45,42,38,0.5)",
                border: "1px solid rgba(120,110,95,0.15)",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[#b0a898] font-serif">
                  Re: {r.reviewerLabel}
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-sm"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
                >
                  {r.position === "agree" ? "Agrees" : "Disagrees"}
                </span>
              </div>
              <p className="text-[11px] text-[#8a8070] font-serif leading-relaxed">
                {r.justification}
              </p>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-2">
        Resolution
      </div>

      <select
        value={resolution}
        onChange={(e) => setResolution(e.target.value as RebuttalResolutionDb | "")}
        className="w-full rounded-[6px] px-3 py-2 text-[12px] font-serif text-[#d4ccc0] outline-none cursor-pointer mb-2"
        style={{
          background: "rgba(30,28,24,0.6)",
          border: "1px solid rgba(120,110,95,0.2)",
          appearance: "none",
        }}
      >
        <option value="">Select resolution...</option>
        <option value="upheld">Upheld (reviewer was wrong)</option>
        <option value="rejected">Rejected (reviewer was right)</option>
        <option value="partial">Partial</option>
      </select>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Editor notes on resolution..."
        rows={3}
        className="w-full rounded-[6px] p-3 text-[12px] font-serif text-[#d4ccc0] outline-none resize-none mb-3"
        style={{
          background: "rgba(30,28,24,0.6)",
          border: "1px solid rgba(120,110,95,0.2)",
        }}
      />

      <button
        onClick={() => { if (resolution) onResolve(resolution, notes); }}
        disabled={!resolution || isResolving}
        className="w-full px-4 py-2 rounded text-[12px] font-serif cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, rgba(180,160,120,0.25), rgba(160,140,100,0.15))",
          border: "1px solid rgba(180,160,120,0.4)",
          color: "#d4c8a8",
        }}
      >
        {isResolving ? "Resolving..." : "Resolve Rebuttal"}
      </button>
    </div>
  );
}
