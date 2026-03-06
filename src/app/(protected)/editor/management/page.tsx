import { JournalManagement } from "@/src/features/editor/components/journal-management.client";
import { getSession } from "@/src/shared/lib/auth/auth";
import {
  getJournalByEditorWallet,
  listReviewerPool,
  listReputationScores,
  listJournalIssues,
  listJournalReviewerWallets,
} from "@/src/features/editor/queries";
import { buildReviewerPool, mapDbToJournalIssue, filterPoolByJournal } from "@/src/features/editor/mappers/journal";

const DEFAULT_AIMS_AND_SCOPE =
  "The Journal of Computational Research publishes original research articles in all areas of computational science, including machine learning, quantum computing, distributed systems, and computational biology. We welcome both theoretical contributions and applied studies that advance the state of the art.";

const DEFAULT_SUBMISSION_CRITERIA =
  "Submissions must include reproducible methodology, accessible datasets, appropriate statistical analysis, and evidence-supported claims. All papers undergo double-blind peer review against pre-registered criteria published on-chain before review begins.";

export default async function JournalManagementPage() {
  const sessionWallet = await getSession();
  const journal = sessionWallet
    ? await getJournalByEditorWallet(sessionWallet)
    : null;

  if (!journal) {
    return (
      <JournalManagement
        journalId=""
        journalName="—"
        issues={[]}
        aimsAndScope={DEFAULT_AIMS_AND_SCOPE}
        submissionCriteria={DEFAULT_SUBMISSION_CRITERIA}
        reviewers={[]}
        allReviewers={[]}
      />
    );
  }

  const [reviewers, scores, dbIssues, journalReviewerRows] = await Promise.all([
    listReviewerPool(),
    listReputationScores(),
    listJournalIssues(journal.id),
    listJournalReviewerWallets(journal.id),
  ]);

  const allReviewers = buildReviewerPool(reviewers, scores);
  const issues = dbIssues.map(mapDbToJournalIssue);
  const poolWalletSet = new Set(journalReviewerRows.map(r => r.reviewerWallet.toLowerCase()));
  const { poolReviewers } = filterPoolByJournal(allReviewers, poolWalletSet);

  return (
    <JournalManagement
      journalId={journal.id}
      journalName={journal.name}
      issues={issues}
      aimsAndScope={journal.aimsAndScope ?? DEFAULT_AIMS_AND_SCOPE}
      submissionCriteria={journal.submissionCriteria ?? DEFAULT_SUBMISSION_CRITERIA}
      reviewers={poolReviewers}
      allReviewers={allReviewers}
    />
  );
}
