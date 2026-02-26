"use client";

import type { PoolReviewer, JournalIssue } from "@/src/shared/types/editor-dashboard";
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
    <div className="max-w-[1280px] mx-auto py-8 px-10">
      <div className="font-serif text-xl text-[#e8e0d4] mb-6">{journalName}</div>

      <IssuesGrid issues={issues} />
      <EditableSection title="Aims and Scope" initialValue={aimsAndScope} />
      <EditableSection title="Submission Criteria" initialValue={submissionCriteria} />
      <ReviewerGrid reviewers={reviewers} />
    </div>
  );
}
