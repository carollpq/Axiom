'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { PoolReviewer, JournalIssue } from '@/src/features/editor/types';
import { IssuesGrid } from './management/issues-grid.client';
import { EditableSection } from './management/editable-section.client';
import { ReviewerGrid } from './management/reviewer-grid.client';
import {
  updateJournalAction,
  createIssueAction,
  addReviewerToPoolAction,
} from '@/src/features/editor/actions';

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

  const handleSaveAims = useCallback(
    async (value: string) => {
      if (!journalId) {
        toast.error('No journal associated with your account');
        return;
      }
      await updateJournalAction(journalId, { aimsAndScope: value });
      router.refresh();
      toast.success('Aims and scope saved');
    },
    [journalId, router],
  );

  const handleSaveCriteria = useCallback(
    async (value: string) => {
      if (!journalId) {
        toast.error('No journal associated with your account');
        return;
      }
      await updateJournalAction(journalId, { submissionCriteria: value });
      router.refresh();
      toast.success('Submission criteria saved');
    },
    [journalId, router],
  );

  const handleCreateIssue = useCallback(
    async (label: string) => {
      if (!journalId) {
        toast.error('No journal associated with your account');
        return;
      }
      await createIssueAction(journalId, label);
      router.refresh();
      toast.success('Issue created');
    },
    [journalId, router],
  );

  const handleAddReviewer = useCallback(
    async (wallet: string) => {
      if (!journalId) {
        toast.error('No journal associated with your account');
        return;
      }
      await addReviewerToPoolAction(journalId, wallet);
      router.refresh();
      toast.success('Reviewer added to pool');
    },
    [journalId, router],
  );

  if (!journalId) {
    return (
      <div className="max-w-[1200px] mx-auto px-10 py-8">
        <div className="mb-8">
          <h1 className="text-[28px] font-normal text-[#e8e0d4] m-0 tracking-[0.5px] font-serif">
            Journal Management
          </h1>
        </div>
        <div
          className="rounded-[8px] p-6 mb-6"
          style={{
            background: 'rgba(212, 100, 90, 0.15)',
            border: '1px solid rgba(212, 100, 90, 0.3)',
          }}
        >
          <p className="text-[13px] text-[#d4a89a] m-0">
            No journal associated with your account. Please contact the system
            administrator to create or assign a journal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-normal text-[#e8e0d4] m-0 tracking-[0.5px] font-serif">
          Journal Management
        </h1>
        <p className="text-[13px] text-[#6a6050] mt-1.5 italic">
          {journalName}
        </p>
      </div>

      <IssuesGrid issues={issues} onCreateIssue={handleCreateIssue} />
      <EditableSection
        title="Aims and Scope"
        initialValue={aimsAndScope}
        onSave={handleSaveAims}
      />
      <EditableSection
        title="Submission Criteria"
        initialValue={submissionCriteria}
        onSave={handleSaveCriteria}
      />
      <ReviewerGrid
        reviewers={reviewers}
        allReviewers={allReviewers}
        onAddReviewer={handleAddReviewer}
      />
    </div>
  );
}
