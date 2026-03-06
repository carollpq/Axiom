"use client";

import dynamic from "next/dynamic";
import { ThreeColumnLayout } from "@/src/shared/components/ThreeColumnLayout";
import { DynamicPdfViewer as PdfViewer } from "@/src/shared/components/DynamicPdfViewer";
import { PaperList } from "./PaperList.client";
import { ReviewStatusPanel } from "./sidebar/ReviewStatusPanel";
import { useUnderReview } from "@/src/features/editor/hooks/useUnderReview";
import { useDecryptPaper } from "@/src/shared/hooks/useDecryptPaper";
import { SelectionPlaceholder } from "@/src/shared/components/SelectionPlaceholder";
import type {
  PaperCardData,
  PoolReviewer,
  ReviewerWithStatus,
  RebuttalInfo,
} from "@/src/features/editor/types";
import type { AuthorResponseStatusDb } from "@/src/shared/lib/db/schema";

const FinalDecisionPanel = dynamic(
  () => import("./sidebar/FinalDecisionPanel").then((m) => ({ default: m.FinalDecisionPanel })),
  { loading: () => <div className="p-6 text-[13px] text-[#6a6050]">Loading decision panel...</div> }
);
const ResolveRebuttalPanel = dynamic(
  () => import("./sidebar/ResolveRebuttalPanel").then((m) => ({ default: m.ResolveRebuttalPanel })),
  { loading: () => <div className="p-6 text-[13px] text-[#6a6050]">Loading rebuttal panel...</div> }
);
const AssignReviewersPanel = dynamic(
  () => import("./sidebar/AssignReviewersPanel").then((m) => ({ default: m.AssignReviewersPanel })),
  { loading: () => <div className="p-6 text-[13px] text-[#6a6050]">Loading reviewer panel...</div> }
);

interface UnderReviewProps {
  papers: PaperCardData[];
  reviewerPool: PoolReviewer[];
  reviewStatuses: Record<string, ReviewerWithStatus[]>;
  authorResponseStatuses: Record<string, AuthorResponseStatusDb | null>;
  rebuttalsBySubmission?: Record<string, RebuttalInfo>;
}

export function UnderReviewClient({
  papers,
  reviewerPool,
  reviewStatuses,
  authorResponseStatuses,
  rebuttalsBySubmission,
}: UnderReviewProps) {
  const {
    selectedId,
    setSelectedId,
    selected,
    currentReviewers,
    allReviewsComplete,
    currentAuthorResponseStatus,
    canMakeDecision,
    editorComment,
    setEditorComment,
    decision,
    setDecision,
    releaseToAuthor,
    additionalAssigned,
    assignReviewer,
    removeReviewer,
    reviewerSearch,
    setReviewerSearch,
    timelineDays,
    currentRebuttal,
    resolveRebuttal,
    isResolvingRebuttal,
  } = useUnderReview({
    initialPapers: papers,
    initialReviewerPool: reviewerPool,
    reviewStatuses,
    authorResponseStatuses,
    rebuttalsBySubmission,
  });

  const { fileUrl: decryptedUrl } = useDecryptPaper(
    selected?.hasLitData ? selected.paperId : null,
    true,
  );

  return (
    <ThreeColumnLayout
      title="Under Review"
      countLabel={`${papers.length} ${papers.length === 1 ? "paper" : "papers"}`}
      sidebarTitle="Review Status"
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
            <ReviewStatusPanel reviewers={currentReviewers} />
            {currentRebuttal && currentRebuttal.status === "submitted" ? (
              <ResolveRebuttalPanel
                rebuttalId={currentRebuttal.id}
                responses={currentRebuttal.responses.map((r, i) => ({
                  reviewId: r.reviewId,
                  reviewerLabel: `Reviewer ${String.fromCharCode(65 + i)}`,
                  position: r.position,
                  justification: r.justification,
                }))}
                onResolve={resolveRebuttal}
                isResolving={isResolvingRebuttal}
              />
            ) : (
              <FinalDecisionPanel
                comment={editorComment}
                onCommentChange={setEditorComment}
                decision={decision}
                onDecisionChange={setDecision}
                onRelease={releaseToAuthor}
                allReviewsComplete={allReviewsComplete}
                authorResponseStatus={currentAuthorResponseStatus}
                canMakeDecision={canMakeDecision}
              />
            )}
            <AssignReviewersPanel
              reviewerPool={reviewerPool}
              assignedIds={additionalAssigned}
              search={reviewerSearch}
              onSearchChange={setReviewerSearch}
              onAssign={assignReviewer}
              onRemove={removeReviewer}
              timelineDays={timelineDays}
              actionLabel="Assign"
            />
          </>
        ) : (
          <SelectionPlaceholder message="Select a paper to view review status" />
        )
      }
    />
  );
}
