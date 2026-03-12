'use client';

import type { CompletedReviewExtended } from '@/src/features/reviewer/types/dashboard';
import { ReviewerThreeColumnShell } from '../reviewer-three-column-shell.client';
import { CompletedReviewSidebar } from './completed-review-sidebar.client';

interface Props {
  initialCompleted: CompletedReviewExtended[];
}

export function CompletedPapersClient({ initialCompleted }: Props) {
  return (
    <ReviewerThreeColumnShell
      items={initialCompleted}
      title="Completed Reviews"
      countLabel={`${initialCompleted.length} review${initialCompleted.length !== 1 ? 's' : ''}`}
      sidebarTitle="Review Summary"
      emptyMessage="No completed reviews."
      sidebarPlaceholder="Select a paper to see your review"
      renderSidebar={(selected) => <CompletedReviewSidebar paper={selected} />}
    />
  );
}
