import { JournalManagement } from "@/src/features/editor/components/journal-management.client";
import { mockEditorProfile, mockIssues, mockReviewerPool } from "@/src/features/editor/mock-data";

export default async function JournalManagementPage() {
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
