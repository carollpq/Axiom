"use client";

import { ThreeColumnLayout } from "@/src/shared/components/ThreeColumnLayout";
import { PdfViewer } from "@/src/shared/components/PdfViewer";
import { PaperList } from "./PaperList.client";
import { AssignReviewersPanel } from "./sidebar/AssignReviewersPanel";
import { DeskRejectPanel } from "./sidebar/DeskRejectPanel";
import { CriteriaBuilder } from "./CriteriaBuilder";
import { useIncomingPapers } from "@/src/features/editor/hooks/useIncomingPapers";
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

  return (
    <ThreeColumnLayout
      list={
        <PaperList
          papers={papers}
          selectedId={selectedId}
          onSelect={setSelectedId}
          sectionTitle="Incoming Papers"
        />
      }
      viewer={
        <PdfViewer fileUrl={selected?.fileUrl} title={selected?.title} />
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
          <div className="p-6 text-center text-[#6a6050] font-serif text-sm">
            Select a paper to view actions
          </div>
        )
      }
    />
  );
}
