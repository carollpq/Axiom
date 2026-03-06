"use client";

import { ThreeColumnLayout } from "@/src/shared/components/ThreeColumnLayout";
import { DynamicPdfViewer as PdfViewer } from "@/src/shared/components/DynamicPdfViewer";
import { PaperList } from "./PaperList.client";
import { AssignReviewersPanel } from "./sidebar/AssignReviewersPanel";
import { DeskRejectPanel } from "./sidebar/DeskRejectPanel";
import { CriteriaBuilder } from "./CriteriaBuilder";
import { useIncomingPapers } from "@/src/features/editor/hooks/useIncomingPapers";
import { useDecryptPaper } from "@/src/shared/hooks/useDecryptPaper";
import { SelectionPlaceholder } from "@/src/shared/components/SelectionPlaceholder";
import type { PaperCardData, PoolReviewer } from "@/src/features/editor/types";

interface IncomingPapersProps {
  papers: PaperCardData[];
  reviewerPool: PoolReviewer[];
}

export function IncomingPapersClient({ papers, reviewerPool }: IncomingPapersProps) {
  const {
    selectedId,
    setSelectedId,
    selected,
    assignedIds,
    assignReviewer,
    removeReviewer,
    reviewerSearch,
    setReviewerSearch,
    deskRejectComment,
    setDeskRejectComment,
    timelineDays,
    sendInvites,
    submitDeskReject,
  } = useIncomingPapers(papers, reviewerPool);

  const { fileUrl: decryptedUrl } = useDecryptPaper(
    selected?.hasLitData ? selected.paperId : null,
    true,
  );

  return (
    <ThreeColumnLayout
      title="Incoming Papers"
      countLabel={`${papers.length} ${papers.length === 1 ? "paper" : "papers"}`}
      sidebarTitle="Actions"
      list={
        <PaperList
          papers={papers}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      }
      viewer={
        <PdfViewer fileUrl={decryptedUrl ?? selected?.fileUrl} title={selected?.title} />
      }
      sidebar={
        selectedId ? (
          <>
            <CriteriaBuilder submissionId={selectedId} />
            <AssignReviewersPanel
              reviewerPool={reviewerPool}
              assignedIds={assignedIds}
              search={reviewerSearch}
              onSearchChange={setReviewerSearch}
              onAssign={assignReviewer}
              onRemove={removeReviewer}
              timelineDays={timelineDays}
              actionLabel="Send Invites"
              onAction={sendInvites}
            />
            <DeskRejectPanel
              comment={deskRejectComment}
              onCommentChange={setDeskRejectComment}
              onSend={submitDeskReject}
            />
          </>
        ) : (
          <SelectionPlaceholder message="Select a paper to view actions" />
        )
      }
    />
  );
}
