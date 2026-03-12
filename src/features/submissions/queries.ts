import { db } from '@/src/shared/lib/db';
import { submissions } from '@/src/shared/lib/db/schema';
import { eq } from 'drizzle-orm';

/** Fetches submission with journal + paper (+ owner). Throws if not found. */
async function fetchSubmission(submissionId: string) {
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: { journal: true, paper: { with: { owner: true } } },
  });

  if (!submission) throw new Error('Submission not found');
  return submission;
}

/** Verifies the caller owns the paper. Returns the submission. */
export async function requireSubmissionAuthor(
  submissionId: string,
  wallet: string,
) {
  const submission = await fetchSubmission(submissionId);
  if (
    submission.paper.owner?.walletAddress?.toLowerCase() !==
    wallet.toLowerCase()
  ) {
    throw new Error('Forbidden');
  }

  return submission;
}

/** Verifies the caller is the journal editor. Returns the submission. */
export async function requireSubmissionEditor(
  submissionId: string,
  wallet: string,
) {
  const submission = await fetchSubmission(submissionId);
  if (submission.journal.editorWallet.toLowerCase() !== wallet.toLowerCase()) {
    throw new Error('Forbidden');
  }

  return submission;
}
