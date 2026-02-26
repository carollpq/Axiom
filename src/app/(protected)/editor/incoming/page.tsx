import { IncomingPapersClient } from "@/src/features/editor/components/incoming-papers.client";
import { mockIncomingPapers, mockReviewerPool } from "@/src/features/editor/mock-data";

export default async function IncomingPapersPage() {
  return (
    <IncomingPapersClient
      papers={mockIncomingPapers}
      reviewerPool={mockReviewerPool}
    />
  );
}
