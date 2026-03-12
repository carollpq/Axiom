'use client';

import { useMemo } from 'react';
import type { DbAssignedReview } from '@/src/features/reviewer/queries';
import {
  mapDbToAssignedReviewExtended,
  type EditorNameMap,
} from '@/src/features/reviewer/lib/dashboard';
import { ReviewerThreeColumnShell } from '../reviewer-three-column-shell.client';
import { AssignedReviewSidebar } from './assigned-review-sidebar.client';

interface Props {
  initialRaw: DbAssignedReview[];
  editorNames?: EditorNameMap;
}

export function PapersUnderReviewClient({ initialRaw, editorNames }: Props) {
  const mapped = useMemo(
    () =>
      initialRaw.map((a, i) =>
        mapDbToAssignedReviewExtended(a, i, editorNames),
      ),
    [initialRaw, editorNames],
  );

  return (
    <ReviewerThreeColumnShell
      items={mapped}
      title="Papers Under Review"
      countLabel={`${mapped.length} paper${mapped.length !== 1 ? 's' : ''}`}
      sidebarTitle="Review Details"
      emptyMessage="No papers under review."
      renderSidebar={(selected, index) => (
        <AssignedReviewSidebar
          paper={selected}
          rawAssignment={initialRaw[index]}
        />
      )}
    />
  );
}
