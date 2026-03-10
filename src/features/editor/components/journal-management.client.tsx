'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { PoolReviewer, JournalIssue } from '@/src/features/editor/types';
import { IssuesGrid } from './management/IssuesGrid';
import { EditableSection } from './management/EditableSection';
import { ReviewerGrid } from './management/ReviewerGrid';

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
    async (path: string, body: Record<string, unknown>, method = 'POST') => {
      const res = await fetch(`/api/journals/${journalId}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || 'Request failed');
      }
      router.refresh();
    },
    [journalId, router],
  );

  const handleSaveAims = useCallback(
    async (value: string) => {
      if (!journalId) {
        toast.error('No journal associated with your account');
        return;
      }
      await postAndRefresh('', { aimsAndScope: value }, 'PATCH');
      toast.success('Aims and scope saved');
    },
    [postAndRefresh, journalId],
  );

  const handleSaveCriteria = useCallback(
    async (value: string) => {
      if (!journalId) {
        toast.error('No journal associated with your account');
        return;
      }
      await postAndRefresh('', { submissionCriteria: value }, 'PATCH');
      toast.success('Submission criteria saved');
    },
    [postAndRefresh, journalId],
  );

  const handleCreateIssue = useCallback(
    async (label: string) => {
      if (!journalId) {
        toast.error('No journal associated with your account');
        return;
      }
      await postAndRefresh('/issues', { label });
      toast.success('Issue created');
    },
    [postAndRefresh, journalId],
  );

  const handleAddReviewer = useCallback(
    async (wallet: string) => {
      if (!journalId) {
        toast.error('No journal associated with your account');
        return;
      }
      await postAndRefresh('/reviewers', { reviewerWallet: wallet });
      toast.success('Reviewer added to pool');
    },
    [postAndRefresh, journalId],
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
