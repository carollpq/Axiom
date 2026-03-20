// Under-review — server data fetch for active review pipeline.
// Includes reviewer assignment statuses, author response tracking, and
// rebuttal data for submissions in rebuttal_open status.

import { Suspense } from 'react';
import { UnderReviewClient } from '@/src/features/editor/components/under-review.client';
import {
  listJournalSubmissions,
  listReviewerPool,
  listReputationScores,
} from '@/src/features/editor/queries';
import {
  mapDbToPaperCardData,
  buildReviewerPool,
  buildNameByWallet,
  buildReviewStatusMap,
} from '@/src/features/editor/lib/journal';
import { fetchEditorPageData } from '@/src/features/editor/queries';
import { getRebuttalBySubmission } from '@/src/features/rebuttals/queries';
import type { AuthorResponseStatusDb } from '@/src/shared/lib/db/schema';
import UnderReviewLoading from './loading';

async function UnderReviewContent() {
  const { journal } = await fetchEditorPageData();

  if (!journal) {
    return (
      <UnderReviewClient
        papers={[]}
        reviewerPool={[]}
        reviewStatuses={{}}
        authorResponseStatuses={{}}
      />
    );
  }

  const [allSubs, reviewers, scores] = await Promise.all([
    listJournalSubmissions(journal.id),
    listReviewerPool(),
    listReputationScores(),
  ]);

  const nameByWallet = buildNameByWallet(reviewers);

  // Submissions actively in the review pipeline (assigned through rebuttal)
  const underReviewSubs = allSubs.filter(
    (s) =>
      s.status === 'reviewers_assigned' ||
      s.status === 'under_review' ||
      s.status === 'reviews_completed' ||
      s.status === 'rebuttal_open',
  );

  const papers = underReviewSubs.map(mapDbToPaperCardData);
  const reviewerPool = buildReviewerPool(reviewers, scores);
  const reviewStatuses = buildReviewStatusMap(underReviewSubs, nameByWallet, {
    includeReviewContent: true,
  });

  // Track whether each author has responded to completed reviews
  const authorResponseStatuses: Record<string, AuthorResponseStatusDb | null> =
    {};
  for (const s of underReviewSubs) {
    authorResponseStatuses[s.id] =
      (s.authorResponseStatus as AuthorResponseStatusDb | null) ?? null;
  }

  // Fetch rebuttal data for submissions in rebuttal_open status (in parallel)
  const rebuttalEntries = await Promise.all(
    underReviewSubs
      .filter((s) => s.status === 'rebuttal_open')
      .map(async (s) => {
        const rebuttal = await getRebuttalBySubmission(s.id);
        if (!rebuttal) return null;
        return [
          s.id,
          {
            id: rebuttal.id,
            submissionId: rebuttal.submissionId,
            status: rebuttal.status as
              | 'open'
              | 'submitted'
              | 'under_review'
              | 'resolved',
            authorReason: rebuttal.authorReason ?? null,
            responses: rebuttal.responses.map((r) => ({
              reviewId: r.reviewId,
              position: r.position as 'agree' | 'disagree',
              justification: r.justification,
            })),
          },
        ] as const;
      }),
  );
  const rebuttalsBySubmission = Object.fromEntries(
    rebuttalEntries.filter((e): e is NonNullable<typeof e> => e !== null),
  );

  return (
    <UnderReviewClient
      papers={papers}
      reviewerPool={reviewerPool}
      reviewStatuses={reviewStatuses}
      authorResponseStatuses={authorResponseStatuses}
      rebuttalsBySubmission={rebuttalsBySubmission}
    />
  );
}

export default function UnderReviewPage() {
  return (
    <Suspense fallback={<UnderReviewLoading />}>
      <UnderReviewContent />
    </Suspense>
  );
}
