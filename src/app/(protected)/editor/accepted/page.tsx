import { AcceptedPapersClient } from "@/src/features/editor/components/accepted-papers.client";
import { mockAcceptedPapers, mockIssues } from "@/src/features/editor/mock-data";
import type { ReviewerWithStatus } from "@/src/shared/types/editor-dashboard";

const acceptedReviewStatuses: Record<string, ReviewerWithStatus[]> = {
  p8: [
    { id: "r1", name: "Dr. Emily Watson", status: "complete", hasComment: true },
    { id: "r3", name: "Dr. Priya Mehta", status: "complete", hasComment: true },
    { id: "r5", name: "Dr. Anna Kowalski", status: "complete", hasComment: true },
  ],
  p9: [
    { id: "r2", name: "Dr. James Liu", status: "complete", hasComment: true },
    { id: "r6", name: "Dr. Omar Hassan", status: "complete", hasComment: true },
  ],
};

export default async function AcceptedPapersPage() {
  return (
    <AcceptedPapersClient
      papers={mockAcceptedPapers}
      reviewStatuses={acceptedReviewStatuses}
      issues={mockIssues}
    />
  );
}
