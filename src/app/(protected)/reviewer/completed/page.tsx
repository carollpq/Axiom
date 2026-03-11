import { getSession } from '@/src/shared/lib/auth/auth';
import {
  listCompletedReviewsExtended,
  buildEditorNameMap,
} from '@/src/features/reviewer/queries';
import { mapDbToCompletedReviewExtended } from '@/src/features/reviewer/lib/dashboard';
import { CompletedPapersClient } from '@/src/features/reviewer/components/completed/completed-papers.client';

export default async function CompletedPapersPage() {
  const wallet = (await getSession())!;
  const rawCompleted = await listCompletedReviewsExtended(wallet);
  const editorNames = await buildEditorNameMap(rawCompleted);

  return (
    <CompletedPapersClient
      initialCompleted={rawCompleted.map((a, i) =>
        mapDbToCompletedReviewExtended(a, i, editorNames),
      )}
    />
  );
}
