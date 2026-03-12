'use client';

import { useState, useMemo, useCallback } from 'react';
import type { DbAssignedReview } from '@/src/features/reviewer/queries';
import {
  mapDbToAssignedReviewExtended,
  type EditorNameMap,
} from '@/src/features/reviewer/lib/dashboard';
import { ReviewerThreeColumnShell } from '../reviewer-three-column-shell.client';
import { InviteSidebar } from './invite-sidebar.client';

interface Props {
  initialRaw: DbAssignedReview[];
  editorNames?: EditorNameMap;
}

export function IncomingInvitesClient({ initialRaw, editorNames }: Props) {
  const [removedSubmissionIds, setRemovedSubmissionIds] = useState<Set<string>>(
    new Set(),
  );

  const allMapped = useMemo(
    () =>
      initialRaw.map((a, i) =>
        mapDbToAssignedReviewExtended(a, i, editorNames),
      ),
    [initialRaw, editorNames],
  );

  const mapped = useMemo(
    () =>
      allMapped.filter(
        (a) =>
          a.status !== 'Submitted' &&
          !removedSubmissionIds.has(a.submissionId ?? ''),
      ),
    [allMapped, removedSubmissionIds],
  );

  const handleRemove = useCallback((submissionId: string) => {
    setRemovedSubmissionIds((prev) => new Set(prev).add(submissionId));
  }, []);

  return (
    <ReviewerThreeColumnShell
      items={mapped}
      title="Incoming Invites"
      countLabel={`${mapped.length} invite${mapped.length !== 1 ? 's' : ''}`}
      sidebarTitle="Invite Details"
      emptyMessage="No pending invitations at this time."
      renderSidebar={(selected) => (
        <InviteSidebar paper={selected} onRemove={handleRemove} />
      )}
    />
  );
}
