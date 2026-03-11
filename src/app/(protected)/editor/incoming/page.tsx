import { Suspense } from 'react';
import { IncomingPapersClient } from '@/src/features/editor/components/incoming-papers.client';
import { getSession } from '@/src/shared/lib/auth/auth';
import {
  getJournalByEditorWallet,
  listJournalSubmissions,
  listReviewerPool,
  listReputationScores,
} from '@/src/features/editor/queries';
import {
  mapDbToPaperCardData,
  mapDbToPoolReviewer,
} from '@/src/features/editor/lib/journal';
import IncomingPapersLoading from './loading';

async function IncomingPapersContent() {
  const wallet = (await getSession())!;
  const journal = await getJournalByEditorWallet(wallet);

  if (!journal) {
    return <IncomingPapersClient papers={[]} reviewerPool={[]} />;
  }

  const [allSubs, reviewers, scores] = await Promise.all([
    listJournalSubmissions(journal.id),
    listReviewerPool(),
    listReputationScores(),
  ]);

  const scoreByWallet = Object.fromEntries(
    scores.map((s) => [s.userWallet, s]),
  );

  const incomingSubs = allSubs.filter(
    (s) =>
      s.status === 'submitted' ||
      s.status === 'viewed_by_editor' ||
      s.status === 'criteria_published',
  );

  const reviewerPool = reviewers.map((u) =>
    mapDbToPoolReviewer(u, scoreByWallet[u.walletAddress as string]),
  );

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
