// Incoming papers — server data fetch for the first pipeline stage.
// Filters submissions to submitted/viewed/criteria_published statuses, then
// maps DB rows to display objects with reviewer pool for the assignment sidebar.

import { Suspense } from 'react';
import { IncomingPapersClient } from '@/src/features/editor/components/incoming-papers.client';
import {
  listJournalSubmissions,
  listReviewerPool,
  listReputationScores,
  fetchEditorPageData,
} from '@/src/features/editor/queries';
import {
  mapDbToPaperCardData,
  buildReviewerPool,
} from '@/src/features/editor/lib/journal';
import IncomingPapersLoading from './loading';

async function IncomingPapersContent() {
  const { journal } = await fetchEditorPageData();

  if (!journal) {
    return <IncomingPapersClient papers={[]} reviewerPool={[]} />;
  }

  const [allSubs, reviewers, scores] = await Promise.all([
    listJournalSubmissions(journal.id),
    listReviewerPool(),
    listReputationScores(),
  ]);

  // Only show submissions that haven't been assigned reviewers yet
  const incomingSubs = allSubs.filter(
    (s) =>
      s.status === 'submitted' ||
      s.status === 'viewed_by_editor' ||
      s.status === 'criteria_published',
  );

  const reviewerPool = buildReviewerPool(reviewers, scores);

  const papersWithSubmissionId = incomingSubs.map((s) => ({
    ...mapDbToPaperCardData(s),
    submissionId: s.id,
  }));

  return (
    <IncomingPapersClient
      papers={papersWithSubmissionId}
      reviewerPool={reviewerPool}
    />
  );
}

export default function IncomingPapersPage() {
  return (
    <Suspense fallback={<IncomingPapersLoading />}>
      <IncomingPapersContent />
    </Suspense>
  );
}
