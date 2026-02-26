"use client";

import { SearchInput } from "@/src/shared/components/SearchInput";
import type { PoolReviewer } from "@/src/shared/types/editor-dashboard";

interface AssignReviewersPanelProps {
  reviewerPool: PoolReviewer[];
  assignedIds: string[];
  search: string;
  onSearchChange: (v: string) => void;
  onAssign: (id: string) => void;
  onRemove: (id: string) => void;
  timelineDays: number;
  actionLabel?: string;
  onAction?: () => void;
}

export function AssignReviewersPanel({
  reviewerPool,
  assignedIds,
  search,
  onSearchChange,
  onAssign,
  onRemove,
  timelineDays,
  actionLabel = "Send Invites",
  onAction,
}: AssignReviewersPanelProps) {
  const assigned = reviewerPool.filter((r) => assignedIds.includes(r.id));
  const filtered = reviewerPool
    .filter((r) => !assignedIds.includes(r.id))
    .filter(
      (r) =>
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.field.toLowerCase().includes(search.toLowerCase()),
    );

  return (
    <div
      className="p-4"
      style={{ borderBottom: "1px solid rgba(120,110,95,0.1)" }}
    >
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3">
        Assign Reviewers
      </div>

      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search reviewers..."
        size="sm"
      />

      {/* Assigned list */}
      {assigned.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {assigned.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between px-3 py-2 rounded"
              style={{
                background: "rgba(45,42,38,0.6)",
                border: "1px solid rgba(120,110,95,0.15)",
              }}
            >
              <span className="text-[12px] text-[#d4ccc0] font-serif">
                {r.name}
              </span>
              <button
                onClick={() => onRemove(r.id)}
                className="text-[#6a6050] hover:text-[#d4645a] text-sm cursor-pointer"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Unassigned pool */}
      {search && filtered.length > 0 && (
        <div className="mt-2 space-y-1">
          {filtered.slice(0, 4).map((r) => (
            <button
              key={r.id}
              onClick={() => onAssign(r.id)}
              className="w-full flex items-center justify-between px-3 py-2 rounded text-left cursor-pointer transition-colors"
              style={{
                background: "rgba(30,28,24,0.5)",
                border: "1px solid rgba(120,110,95,0.1)",
              }}
            >
              <div>
                <span className="text-[12px] text-[#c9b89e] font-serif">
                  {r.name}
                </span>
                <span className="text-[10px] text-[#6a6050] ml-2">
                  {r.field} &middot; {r.score}
                </span>
              </div>
              <span className="text-[10px] text-[#8a8070]">+ Assign</span>
            </button>
          ))}
        </div>
      )}

      {/* Timeline + action */}
      <div className="mt-3 flex items-center gap-2">
        <div
          className="px-3 py-2 rounded text-[11px] text-[#8a8070] font-serif"
          style={{
            background: "rgba(45,42,38,0.5)",
            border: "1px solid rgba(120,110,95,0.15)",
          }}
        >
          Assigned Timeline: {timelineDays} days
        </div>
        {onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 rounded text-[11px] font-serif cursor-pointer"
            style={{
              background:
                "linear-gradient(135deg, rgba(180,160,120,0.25), rgba(160,140,100,0.15))",
              border: "1px solid rgba(180,160,120,0.4)",
              color: "#d4c8a8",
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
