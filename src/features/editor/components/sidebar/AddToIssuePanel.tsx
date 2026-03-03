"use client";

import type { JournalIssue } from "@/src/features/editor/types";

interface AddToIssuePanelProps {
  issues: JournalIssue[];
  selectedIssue: string;
  onIssueChange: (v: string) => void;
}

export function AddToIssuePanel({
  issues,
  selectedIssue,
  onIssueChange,
}: AddToIssuePanelProps) {
  return (
    <div className="p-4">
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3">
        Add to Issue
      </div>
      <select
        value={selectedIssue}
        onChange={(e) => onIssueChange(e.target.value)}
        className="w-full rounded-[6px] px-3 py-2.5 text-[12px] font-serif text-[#d4ccc0] outline-none cursor-pointer"
        style={{
          background: "rgba(30,28,24,0.6)",
          border: "1px solid rgba(120,110,95,0.2)",
          appearance: "none",
        }}
      >
        <option value="">Select issue...</option>
        {issues.map((issue) => (
          <option key={issue.id} value={issue.id}>
            {issue.label}
          </option>
        ))}
      </select>
    </div>
  );
}
