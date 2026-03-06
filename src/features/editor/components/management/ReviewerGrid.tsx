"use client";

import { useState } from "react";
import type { PoolReviewer } from "@/src/features/editor/types";

interface ReviewerGridProps {
  reviewers: PoolReviewer[];
  allReviewers?: PoolReviewer[];
  onAddReviewer?: (wallet: string) => Promise<void>;
}

export function ReviewerGrid({ reviewers, allReviewers, onAddReviewer }: ReviewerGridProps) {
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [adding, setAdding] = useState(false);

  const availableToAdd = (allReviewers ?? []).filter(
    r => !reviewers.some(existing => existing.id === r.id),
  );

  const handleAdd = async (wallet: string) => {
    if (!onAddReviewer) return;
    setAdding(true);
    try {
      await onAddReviewer(wallet);
    } finally {
      setAdding(false);
      setShowAddDropdown(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-4">Reviewer Pool</div>
      <div className="grid grid-cols-4 gap-4">
        {reviewers.length === 0 && (
          <div className="col-span-4 py-6 text-center text-[13px] text-[#6a6050] italic">
            No reviewers in pool yet.
          </div>
        )}
        {reviewers.map((r) => (
          <div
            key={r.id}
            className="rounded-[6px] p-5 flex flex-col items-center text-center cursor-pointer transition-colors"
            style={{
              background: "rgba(45,42,38,0.5)",
              border: "1px solid rgba(120,110,95,0.2)",
            }}
          >
            <div
              className="rounded-full flex items-center justify-center font-serif text-sm mb-3"
              style={{
                width: 56,
                height: 56,
                background: "linear-gradient(135deg, rgba(120,110,95,0.3), rgba(80,72,60,0.3))",
                border: "2px solid rgba(120,110,95,0.3)",
                color: "#c9b89e",
              }}
            >
              {r.name
                .split(" ")
                .filter((_, i, a) => i === 0 || i === a.length - 1)
                .map((w) => w[0])
                .join("")}
            </div>
            <div className="font-serif text-[12px] text-[#e8e0d4] mb-0.5">{r.name}</div>
            <div className="text-[10px] text-[#8a8070]">Rep Score: {r.score}</div>
            <div className="text-[10px] text-[#6a6050]">{r.institution}</div>
          </div>
        ))}

        <div
          className="rounded-[6px] p-5 flex flex-col items-center justify-center cursor-pointer transition-colors relative"
          style={{
            border: "2px dashed rgba(120,110,95,0.25)",
            minHeight: 140,
          }}
          onClick={() => setShowAddDropdown(!showAddDropdown)}
        >
          <div className="text-[12px] text-[#6a6050] font-serif text-center">
            {adding ? "Adding..." : "Add new reviewer..."}
          </div>

          {showAddDropdown && availableToAdd.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-[6px] z-10 max-h-48 overflow-y-auto"
              style={{
                background: "rgba(35,32,28,0.98)",
                border: "1px solid rgba(120,110,95,0.3)",
              }}
            >
              {availableToAdd.map(r => (
                <button
                  key={r.id}
                  className="w-full text-left px-3 py-2 text-[11px] font-serif cursor-pointer transition-colors"
                  style={{ color: "#d4ccc0", borderBottom: "1px solid rgba(120,110,95,0.1)" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdd(r.wallet);
                  }}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
