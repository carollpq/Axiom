'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { InviteCard } from './invite-card.client';
import { ConfirmDialog } from '@/src/shared/components/ConfirmDialog';
import type { AssignedReviewExtended } from '@/src/features/reviewer/types';

interface InviteCardListProps {
  invites: AssignedReviewExtended[];
}

export function InviteCardList({
  invites: initialInvites,
}: InviteCardListProps) {
  const [invites, setInvites] = useState(initialInvites);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] =
    useState<AssignedReviewExtended | null>(null);

  const handleAccept = async (submissionId: string) => {
    setLoadingId(submissionId);
    try {
      const res = await fetch(
        `/api/submissions/${submissionId}/accept-assignment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'accept' }),
        },
      );

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to accept assignment');
      }

      setInvites((prev) =>
        prev.filter((inv) => inv.submissionId !== submissionId),
      );
      toast.success('Invitation accepted');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to accept invitation';
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRejectClick = async (submissionId: string) => {
    const target = invites.find((inv) => inv.submissionId === submissionId);
    if (target) setDeclineTarget(target);
  };

  const confirmDecline = async () => {
    if (!declineTarget?.submissionId) return;
    const submissionId = declineTarget.submissionId;
    setDeclineTarget(null);
    setLoadingId(submissionId);
    try {
      const res = await fetch(
        `/api/submissions/${submissionId}/accept-assignment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'decline' }),
        },
      );

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to decline assignment');
      }

      setInvites((prev) =>
        prev.filter((inv) => inv.submissionId !== submissionId),
      );
      toast.success('Invitation declined');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to decline invitation';
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  };

  if (invites.length === 0) {
    return (
      <div
        className="rounded-lg p-12 text-center"
        style={{
          backgroundColor: 'rgba(120,110,95,0.15)',
          color: '#8a8070',
        }}
      >
        <p className="font-serif">No pending invitations at this time</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {invites.map((invite) => (
          <InviteCard
            key={invite.assignmentId}
            review={invite}
            paperAbstract={invite.abstract}
            authors={invite.authors}
            pdfUrl={invite.pdfUrl}
            editorName={invite.editorName}
            onAccept={handleAccept}
            onReject={handleRejectClick}
            isLoading={loadingId === invite.submissionId}
          />
        ))}
      </div>
      <ConfirmDialog
        isOpen={!!declineTarget}
        onClose={() => setDeclineTarget(null)}
        onConfirm={confirmDecline}
        title="Decline Invitation"
        message={`Are you sure you want to decline the review invitation for "${declineTarget?.title ?? 'this paper'}"? This action cannot be undone.`}
        confirmLabel="Decline"
        confirmVariant="red"
        isLoading={false}
        loadingLabel="Declining..."
      />
    </>
  );
}
