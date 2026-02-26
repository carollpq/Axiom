import { UnderReviewClient } from "@/src/features/editor/components/under-review.client";
import {
  mockUnderReviewPapers,
  mockReviewerPool,
  mockReviewStatuses,
} from "@/src/features/editor/mock-data";

export default async function UnderReviewPage() {
  return (
    <UnderReviewClient
      papers={mockUnderReviewPapers}
      reviewerPool={mockReviewerPool}
      reviewStatuses={mockReviewStatuses}
    />
  );
}
