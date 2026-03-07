import { getSession } from '@/src/shared/lib/auth/auth';
import { listAssignedReviews } from '@/src/features/reviewer/queries';
import { PapersUnderReviewClient } from '@/src/features/reviewer/components/assigned/papers-under-review.client';

export default async function PapersUnderReviewPage() {
  const wallet = (await getSession())!;
  const rawAssigned = await listAssignedReviews(wallet);

  return <PapersUnderReviewClient initialRaw={rawAssigned} />;
}
