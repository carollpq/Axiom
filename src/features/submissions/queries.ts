import { db } from '@/src/shared/lib/db';
import { submissions } from '@/src/shared/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Editor ownership check for server actions.
 */
export async function requireSubmissionEditor(
  submissionId: string,
  wallet: string,
) {
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: { journal: true, paper: { with: { owner: true } } },
  });

  if (!submission) throw new Error('Submission not found');
  if (submission.journal.editorWallet.toLowerCase() !== wallet.toLowerCase()) {
    throw new Error('Forbidden');
  }

  return submission;
}
