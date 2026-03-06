"use client";

import { ThreeColumnLayout } from "@/src/shared/components/ThreeColumnLayout";
import { DynamicPdfViewer as PdfViewer } from "@/src/shared/components/DynamicPdfViewer";
import { PaperList } from "./PaperList.client";
import { ReviewCommentsPanel } from "./sidebar/ReviewCommentsPanel";
import { AddToIssuePanel } from "./sidebar/AddToIssuePanel";
import { useAcceptedPapers } from "@/src/features/editor/hooks/useAcceptedPapers";
import { useDecryptPaper } from "@/src/shared/hooks/useDecryptPaper";
import { SelectionPlaceholder } from "@/src/shared/components/SelectionPlaceholder";
import type {
  PaperCardData,
  ReviewerWithStatus,
  JournalIssue,
} from "@/src/features/editor/types";

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

  const { fileUrl: decryptedUrl } = useDecryptPaper(
    selected?.hasLitData ? selected.paperId : null,
    true,
  );

  return (
    <ThreeColumnLayout
      title="Accepted Papers"
      countLabel={`${papers.length} ${papers.length === 1 ? "paper" : "papers"}`}
      sidebarTitle="Details"
      list={
        <PaperList
          papers={papers}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      }
      viewer={<PdfViewer fileUrl={decryptedUrl ?? selected?.fileUrl} title={selected?.title} />}
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
          <SelectionPlaceholder message="Select a paper to view details" />
        )
      }
    />
  );
}
