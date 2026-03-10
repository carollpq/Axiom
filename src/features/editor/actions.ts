'use server';

import { after } from 'next/server';
import {
  requireAuth,
  requireJournalEditor,
} from '@/src/shared/lib/server-action-helpers';
import { ROUTES } from '@/src/shared/lib/routes';
import {
  updateJournalMetadata,
  createJournalIssue,
  addPaperToIssue,
  removePaperFromIssue,
  addReviewerToPool,
  removeReviewerFromPool,
} from '@/src/features/editor/mutations';
import { createNotification } from '@/src/features/notifications/mutations';
import { listJournals } from '@/src/features/editor/queries';
import { db } from '@/src/shared/lib/db';
import { journals } from '@/src/shared/lib/db/schema';
import { eq } from 'drizzle-orm';

/** Thin wrapper so client components can call the cached query. */
export async function listJournalsAction() {
  return listJournals();
}

export async function updateJournalAction(
  journalId: string,
  data: { aimsAndScope?: string; submissionCriteria?: string },
) {
  const wallet = await requireAuth();
  await requireJournalEditor(journalId, wallet);

  await updateJournalMetadata(journalId, data);
  return { ok: true };
}

export async function createIssueAction(journalId: string, label: string) {
  const wallet = await requireAuth();
  await requireJournalEditor(journalId, wallet);

  if (!label?.trim()) throw new Error('Label is required');

  return createJournalIssue(journalId, label.trim());
}

export async function addReviewerToPoolAction(
  journalId: string,
  reviewerWallet: string,
) {
  const wallet = await requireAuth();
  await requireJournalEditor(journalId, wallet);

  if (!reviewerWallet) throw new Error('reviewerWallet is required');

  const row = await addReviewerToPool(journalId, reviewerWallet);

  // Non-blocking: notify the reviewer
  after(async () => {
    const [journalRow] = await db
      .select({ name: journals.name })
      .from(journals)
      .where(eq(journals.id, journalId))
      .limit(1);

    if (journalRow) {
      await createNotification({
        userWallet: reviewerWallet,
        type: 'pool_added',
        title: 'Added to reviewer pool',
        body: `You have been added to the reviewer pool for ${journalRow.name}. You may be assigned to review submissions.`,
        link: ROUTES.reviewer.root,
      });
    }
  });

  return row;
}

export async function removeReviewerFromPoolAction(
  journalId: string,
  reviewerWallet: string,
) {
  const wallet = await requireAuth();
  await requireJournalEditor(journalId, wallet);

  if (!reviewerWallet) throw new Error('reviewerWallet is required');

  await removeReviewerFromPool(journalId, reviewerWallet);
  return { ok: true };
}

export async function addPaperToIssueAction(
  journalId: string,
  issueId: string,
  submissionId: string,
) {
  const wallet = await requireAuth();
  await requireJournalEditor(journalId, wallet);

  if (!submissionId) throw new Error('submissionId is required');

  return addPaperToIssue(issueId, submissionId);
}

export async function removePaperFromIssueAction(
  journalId: string,
  issueId: string,
  submissionId: string,
) {
  const wallet = await requireAuth();
  await requireJournalEditor(journalId, wallet);

  if (!submissionId) throw new Error('submissionId is required');

  await removePaperFromIssue(issueId, submissionId);
  return { ok: true };
}
