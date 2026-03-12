'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/src/shared/components/confirm-dialog.client';
import { acceptAssignmentAction } from '@/src/features/submissions/actions';
import type { AssignedReviewExtended } from '@/src/features/reviewer/types/dashboard';
import {
  getUrgencyColor,
  formatDaysLeft,
  SidebarField,
  TimelineRow,
} from '@/src/shared/components/sidebar-primitives';

interface InviteSidebarProps {
  paper: AssignedReviewExtended;
  onRemove: (submissionId: string) => void;
}

export function InviteSidebar({ paper, onRemove }: InviteSidebarProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  const urgencyColor = getUrgencyColor(paper.daysLeft);

  const handleRespond = useCallback(
    async (action: 'accept' | 'decline') => {
      if (!paper.submissionId || isLoading) return;
      setIsLoading(true);
      try {
        await acceptAssignmentAction(paper.submissionId, action);
        onRemove(paper.submissionId);
        router.refresh();
        toast.success(
          action === 'accept' ? 'Invitation accepted' : 'Invitation declined',
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : `Failed to ${action} invitation`;
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [paper.submissionId, isLoading, onRemove],
  );

  return (
    <>
      <div className="p-4 space-y-6">
        <SidebarField label="Journal">
          <div className="sidebar-field-value--primary text-sm">
            {paper.journal}
          </div>
        </SidebarField>

        <SidebarField label="Editor">
          <div className="sidebar-field-value text-sm">{paper.editorName}</div>
        </SidebarField>

        <SidebarField label="Timeline">
          <div className="space-y-2">
            <TimelineRow label="Assigned" value={paper.assigned} />
            <TimelineRow label="Deadline" value={paper.deadline} />
            <TimelineRow
              label="Days remaining"
              value={formatDaysLeft(paper.daysLeft)}
              style={{ color: urgencyColor, fontWeight: 'bold' }}
            />
          </div>
        </SidebarField>

        <SidebarField label="Status">
          <span
            className="inline-block text-[11px] px-2 py-1 rounded"
            style={{
              backgroundColor: `${urgencyColor}20`,
              color: urgencyColor,
            }}
          >
            {paper.status}
          </span>
        </SidebarField>

        <div className="sidebar-divider" />

        <div className="flex gap-3">
          <button
            onClick={() => handleRespond('accept')}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded font-serif text-sm font-semibold bg-[var(--accent-green)] text-[var(--surface-base)] transition-all disabled:opacity-50 hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Accept'}
          </button>
          <button
            onClick={() => setShowDeclineDialog(true)}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded font-serif text-sm bg-[rgba(120,110,95,0.3)] text-[var(--text-secondary)] transition-all disabled:opacity-50 hover:brightness-125 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Decline'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeclineDialog}
        onClose={() => setShowDeclineDialog(false)}
        onConfirm={() => handleRespond('decline')}
        title="Decline Invitation"
        message={`Are you sure you want to decline the review invitation for "${paper.title}"? This action cannot be undone.`}
        confirmLabel="Decline"
        confirmVariant="red"
        isLoading={isLoading}
        loadingLabel="Declining..."
      />
    </>
  );
}
