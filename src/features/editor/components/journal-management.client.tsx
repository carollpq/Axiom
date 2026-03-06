"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { PoolReviewer, JournalIssue } from "@/src/features/editor/types";
import { IssuesGrid } from "./management/IssuesGrid";
import { EditableSection } from "./management/EditableSection";
import { ReviewerGrid } from "./management/ReviewerGrid";

interface JournalManagementProps {
  journalId: string;
  journalName: string;
  issues: JournalIssue[];
  aimsAndScope: string;
  submissionCriteria: string;
  reviewers: PoolReviewer[];
  allReviewers: PoolReviewer[];
}

export function JournalManagement({
  journalId,
  journalName,
  issues,
  aimsAndScope,
  submissionCriteria,
  reviewers,
  allReviewers,
}: JournalManagementProps) {
  const router = useRouter();

  const postAndRefresh = useCallback(
    async (path: string, body: Record<string, unknown>, method = "POST") => {
      await fetch(`/api/journals/${journalId}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    },
    [journalId, router],
  );

  const handleSaveAims = useCallback(
    (value: string) => postAndRefresh("", { aimsAndScope: value }, "PATCH"),
    [postAndRefresh],
  );

  const handleSaveCriteria = useCallback(
    (value: string) => postAndRefresh("", { submissionCriteria: value }, "PATCH"),
    [postAndRefresh],
  );

  const handleCreateIssue = useCallback(
    (label: string) => postAndRefresh("/issues", { label }),
    [postAndRefresh],
  );

  const handleAddReviewer = useCallback(
    (wallet: string) => postAndRefresh("/reviewers", { reviewerWallet: wallet }),
    [postAndRefresh],
  );

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-normal text-[#e8e0d4] m-0 tracking-[0.5px] font-serif">
          Journal Management
        </h1>
        <p className="text-[13px] text-[#6a6050] mt-1.5 italic">{journalName}</p>
      </div>

      <IssuesGrid issues={issues} onCreateIssue={handleCreateIssue} />
      <EditableSection title="Aims and Scope" initialValue={aimsAndScope} onSave={handleSaveAims} />
      <EditableSection title="Submission Criteria" initialValue={submissionCriteria} onSave={handleSaveCriteria} />
      <ReviewerGrid reviewers={reviewers} allReviewers={allReviewers} onAddReviewer={handleAddReviewer} />
    </div>
  );
}
