import { getSession } from '@/src/shared/lib/auth/auth';
import { listUserPapers } from '@/src/features/papers/queries';
import { listAssignmentsAndReviewsBySubmissionIds } from '@/src/features/reviews/queries';
import { ViewSubmissionsClient } from '@/src/features/researcher/components/view-submissions/view-submissions.client';
import { buildSubmissionViewData } from '@/src/features/researcher/lib/submissions';

export default async function ViewSubmissionsPage() {
  const wallet = (await getSession())!;
  const papers = await listUserPapers(wallet);

  const allSubmissionIds = papers
    .flatMap((p) => p.submissions ?? [])
    .map((s) => s.id);

  if (allSubmissionIds.length === 0) {
    return <ViewSubmissionsClient submissions={[]} />;
  }

  const { assignments, reviews } =
    await listAssignmentsAndReviewsBySubmissionIds(allSubmissionIds);

  return (
    <ViewSubmissionsClient
      submissions={buildSubmissionViewData(papers, assignments, reviews)}
    />
  );
}
