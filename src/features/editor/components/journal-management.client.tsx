"use client";

import type { PoolReviewer, JournalIssue } from "@/src/features/editor/types";
import { IssuesGrid } from "./management/IssuesGrid";
import { EditableSection } from "./management/EditableSection";
import { ReviewerGrid } from "./management/ReviewerGrid";

interface JournalManagementProps {
  journalName: string;
  issues: JournalIssue[];
  aimsAndScope: string;
  submissionCriteria: string;
  reviewers: PoolReviewer[];
}

export function JournalManagement({
  journalName,
  issues,
  aimsAndScope,
  submissionCriteria,
  reviewers,
}: JournalManagementProps) {
  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-normal text-[#e8e0d4] m-0 tracking-[0.5px] font-serif">
          Journal Management
        </h1>
        <p className="text-[13px] text-[#6a6050] mt-1.5 italic">{journalName}</p>
      </div>

      <IssuesGrid issues={issues} />
      <EditableSection title="Aims and Scope" initialValue={aimsAndScope} />
      <EditableSection title="Submission Criteria" initialValue={submissionCriteria} />
      <ReviewerGrid reviewers={reviewers} />
    </div>
  );
}
