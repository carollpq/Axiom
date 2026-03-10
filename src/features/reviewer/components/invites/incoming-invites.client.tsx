'use client';

import { useState, useMemo, useCallback } from 'react';
import { ThreeColumnLayout } from '@/src/shared/components/three-column-layout';
import { SelectionPlaceholder } from '@/src/shared/components/selection-placeholder';
import { PaperList } from '@/src/shared/components/paper-list.client';
import { DynamicPdfViewer } from '@/src/shared/components/dynamic-pdf-viewer.client';
import { useCollapseSidebar } from '@/src/shared/hooks/useCollapseSidebar';
import type { DbAssignedReview } from '@/src/features/reviewer/queries';
import {
  mapDbToAssignedReviewExtended,
  toReviewerPaperListItems,
  type EditorNameMap,
} from '@/src/features/reviewer/mappers/dashboard';
import { InviteSidebar } from './invite-sidebar.client';

interface Props {
  initialRaw: DbAssignedReview[];
  editorNames?: EditorNameMap;
}

export function IncomingInvitesClient({ initialRaw, editorNames }: Props) {
  useCollapseSidebar();

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

  const [selectedId, setSelectedId] = useState<string | null>(() =>
    mapped[0] ? String(mapped[0].id) : null,
  );

  const paperItems = useMemo(() => toReviewerPaperListItems(mapped), [mapped]);

  const selectedIndex = mapped.findIndex((p) => String(p.id) === selectedId);
  const selected = selectedIndex >= 0 ? mapped[selectedIndex] : null;

  const handleRemove = useCallback(
    (submissionId: string) => {
      setRemovedSubmissionIds((prev) => new Set(prev).add(submissionId));
      // Auto-select next paper
      const remaining = mapped.filter((p) => p.submissionId !== submissionId);
      setSelectedId(remaining[0] ? String(remaining[0].id) : null);
    },
    [mapped],
  );

  return (
    <ThreeColumnLayout
      title="Incoming Invites"
      countLabel={`${mapped.length} invite${mapped.length !== 1 ? 's' : ''}`}
      list={
        <PaperList
          papers={paperItems}
          selectedId={selectedId}
          onSelect={setSelectedId}
          emptyMessage="No pending invitations at this time."
        />
      }
      viewer={
        selected?.pdfUrl ? (
          <DynamicPdfViewer fileUrl={selected.pdfUrl} />
        ) : (
          <SelectionPlaceholder
            message={selected ? 'No PDF available' : 'Select an invite to view'}
          />
        )
      }
      sidebar={
        selected ? (
          <InviteSidebar paper={selected} onRemove={handleRemove} />
        ) : (
          <div className="p-4 text-[12px] text-[var(--text-faint)]">
            Select an invite to see details
          </div>
        )
      }
      sidebarTitle="Invite Details"
    />
  );
}
