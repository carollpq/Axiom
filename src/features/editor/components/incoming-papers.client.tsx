"use client";

import dynamic from "next/dynamic";
import { ThreeColumnLayout } from "@/src/shared/components/ThreeColumnLayout";
import { DynamicPdfViewer as PdfViewer } from "@/src/shared/components/DynamicPdfViewer";
import { PaperList } from "./PaperList.client";
import { useIncomingPapers } from "@/src/features/editor/hooks/useIncomingPapers";
import { useCollapseSidebar } from "@/src/shared/hooks/useCollapseSidebar";
import { useDecryptPaper } from "@/src/shared/hooks/useDecryptPaper";
import { SelectionPlaceholder } from "@/src/shared/components/SelectionPlaceholder";
import type { PaperCardData, PoolReviewer } from "@/src/features/editor/types";

const CriteriaBuilder = dynamic(
  () => import("./CriteriaBuilder").then((m) => ({ default: m.CriteriaBuilder })),
  { loading: () => <div className="p-6 text-[13px] text-[#6a6050]">Loading criteria builder...</div> }
);
const AssignReviewersPanel = dynamic(
  () => import("./sidebar/AssignReviewersPanel").then((m) => ({ default: m.AssignReviewersPanel })),
  { loading: () => <div className="p-6 text-[13px] text-[#6a6050]">Loading reviewer panel...</div> }
);
const DeskRejectPanel = dynamic(
  () => import("./sidebar/DeskRejectPanel").then((m) => ({ default: m.DeskRejectPanel })),
  { loading: () => <div className="p-6 text-[13px] text-[#6a6050]">Loading...</div> }
);

interface IncomingPapersProps {
  papers: PaperCardData[];
  reviewerPool: PoolReviewer[];
}

export function IncomingPapersClient({ papers, reviewerPool }: IncomingPapersProps) {
  useCollapseSidebar();
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
      subtitle="Review new submissions and set criteria"
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
