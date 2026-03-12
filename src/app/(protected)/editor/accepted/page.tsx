// Accepted papers — server data fetch for post-decision papers.
// Includes review content (strengths/weaknesses/recommendation) attached to each
// reviewer status, since accepted papers show transparent review details.
// Also fetches journal issues for the add-to-issue sidebar panel.

import { Suspense } from 'react';
import { AcceptedPapersClient } from '@/src/features/editor/components/accepted-papers.client';
import {
  listJournalSubmissions,
  listReviewerPool,
  listJournalIssues,
} from '@/src/features/editor/queries';
import {
  mapDbToPaperCardData,
  buildNameByWallet,
  mapDbToJournalIssue,
  buildReviewStatusMap,
} from '@/src/features/editor/lib/journal';
import { fetchEditorPageData } from '@/src/features/editor/queries';
import AcceptedPapersLoading from './loading';

async function AcceptedPapersContent() {
  const { journal } = await fetchEditorPageData();

  if (!journal) {
    return (
      <AcceptedPapersClient
        papers={[]}
        reviewStatuses={{}}
        issues={[]}
        journalId=""
      />
    );
  }

  const [allSubs, reviewers, dbIssues] = await Promise.all([
    listJournalSubmissions(journal.id),
    listReviewerPool(),
    listJournalIssues(journal.id),
  ]);

  const nameByWallet = buildNameByWallet(reviewers);
  const issues = dbIssues.map(mapDbToJournalIssue);

  const acceptedSubs = allSubs.filter(
    (s) => s.status === 'accepted' || s.status === 'published',
  );

  const papers = acceptedSubs.map(mapDbToPaperCardData);

  // Include review content for accepted papers — these are shown publicly
  // after final decision per the review transparency policy
  const reviewStatuses = buildReviewStatusMap(acceptedSubs, nameByWallet, {
    includeReviewContent: true,
  });

  return (
    <AcceptedPapersClient
      papers={papers}
      reviewStatuses={reviewStatuses}
      issues={issues}
      journalId={journal.id}
    />
  );
}

export default function AcceptedPapersPage() {
  return (
    <Suspense fallback={<AcceptedPapersLoading />}>
      <AcceptedPapersContent />
    </Suspense>
  );
}
