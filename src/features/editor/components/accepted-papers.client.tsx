"use client";

import { ThreeColumnLayout } from "@/src/shared/components/ThreeColumnLayout";
import { PdfViewerPlaceholder } from "@/src/shared/components/PdfViewerPlaceholder";
import { PaperList } from "./PaperList.client";
import { ReviewCommentsPanel } from "./sidebar/ReviewCommentsPanel";
import { AddToIssuePanel } from "./sidebar/AddToIssuePanel";
import { useAcceptedPapers } from "@/src/features/editor/hooks/useAcceptedPapers";
import type {
  PaperCardData,
  ReviewerWithStatus,
  JournalIssue,
} from "@/src/shared/types/editor-dashboard";

interface AcceptedPapersProps {
  papers: PaperCardData[];
  reviewStatuses: Record<string, ReviewerWithStatus[]>;
  issues: JournalIssue[];
}

export function AcceptedPapersClient({
  papers,
  reviewStatuses,
  issues,
}: AcceptedPapersProps) {
  const {
    selectedId,
    setSelectedId,
    selected,
    currentReviewers,
    selectedIssue,
    setSelectedIssue,
  } = useAcceptedPapers(papers, reviewStatuses);

  return (
    <ThreeColumnLayout
      list={
        <PaperList
          papers={papers}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      }
      viewer={<PdfViewerPlaceholder title={selected?.title} />}
      sidebar={
        selectedId ? (
          <>
            <ReviewCommentsPanel reviewers={currentReviewers} />
            <AddToIssuePanel
              issues={issues}
              selectedIssue={selectedIssue}
              onIssueChange={setSelectedIssue}
            />
          </>
        ) : (
          <div className="p-6 text-center text-[#6a6050] font-serif text-sm">
            Select a paper to view reviews
          </div>
        )
      }
    />
  );
}
