import { JournalManagement } from "@/src/features/editor/components/journal-management.client";
import { getSession } from "@/src/shared/lib/auth/auth";
import {
  getJournalByEditorWallet,
  listReviewerPool,
  listReputationScores,
} from "@/src/features/editor/queries";
import { buildReviewerPool } from "@/src/features/editor/mappers/journal";
import { mockEditorProfile, mockIssues, mockReviewerPool } from "@/src/features/editor/mock-data";

const DEFAULT_AIMS_AND_SCOPE =
  "The Journal of Computational Research publishes original research articles in all areas of computational science, including machine learning, quantum computing, distributed systems, and computational biology. We welcome both theoretical contributions and applied studies that advance the state of the art.";

const DEFAULT_SUBMISSION_CRITERIA =
  "Submissions must include reproducible methodology, accessible datasets, appropriate statistical analysis, and evidence-supported claims. All papers undergo double-blind peer review against pre-registered criteria published on-chain before review begins.";

export default async function JournalManagementPage() {
  const sessionWallet = await getSession();

  if (sessionWallet) {
    const journal = await getJournalByEditorWallet(sessionWallet);
    if (journal) {
      const [reviewers, scores] = await Promise.all([
        listReviewerPool(),
        listReputationScores(),
      ]);

      const reviewerPool = buildReviewerPool(reviewers, scores);

      return (
        <JournalManagement
          journalName={journal.name}
          issues={mockIssues}
          aimsAndScope={DEFAULT_AIMS_AND_SCOPE}
          submissionCriteria={DEFAULT_SUBMISSION_CRITERIA}
          reviewers={reviewerPool}
        />
      );
    }
  }

  return (
    <JournalManagement
      journalName={mockEditorProfile.journalName}
      issues={mockIssues}
      aimsAndScope="The Journal of Computational Research publishes original research articles in all areas of computational science, including machine learning, quantum computing, distributed systems, and computational biology. We welcome both theoretical contributions and applied studies that advance the state of the art."
      submissionCriteria="Submissions must include reproducible methodology, accessible datasets, appropriate statistical analysis, and evidence-supported claims. All papers undergo double-blind peer review against pre-registered criteria published on-chain before review begins."
      reviewers={mockReviewerPool}
    />
  );
}
