"use client";

import { ThreeColumnLayout } from "@/src/shared/components/ThreeColumnLayout";
import { PdfViewer } from "@/src/shared/components/PdfViewer";
import { PaperList } from "./PaperList.client";
import { ReviewStatusPanel } from "./sidebar/ReviewStatusPanel";
import { FinalDecisionPanel } from "./sidebar/FinalDecisionPanel";
import { ResolveRebuttalPanel } from "./sidebar/ResolveRebuttalPanel";
import { AssignReviewersPanel } from "./sidebar/AssignReviewersPanel";
import { useUnderReview } from "@/src/features/editor/hooks/useUnderReview";
import { useDecryptPaper } from "@/src/shared/hooks/useDecryptPaper";
import type {
  PaperCardData,
  PoolReviewer,
  ReviewerWithStatus,
  RebuttalInfo,
} from "@/src/features/editor/types";

interface UnderReviewProps {
  papers: PaperCardData[];
  reviewerPool: PoolReviewer[];
  reviewStatuses: Record<string, ReviewerWithStatus[]>;
  rebuttalsBySubmission?: Record<string, RebuttalInfo>;
}

export function UnderReviewClient({
  papers,
  reviewerPool,
  reviewStatuses,
  rebuttalsBySubmission,
}: UnderReviewProps) {
  const {
    selectedId,
    setSelectedId,
    selected,
    currentReviewers,
    allCriteriaMet,
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
    openRebuttal,
    resolveRebuttal,
    isOpeningRebuttal,
    isResolvingRebuttal,
  } = useUnderReview(papers, reviewerPool, reviewStatuses, rebuttalsBySubmission);

  const { fileUrl: decryptedUrl } = useDecryptPaper(
    selected?.hasLitData ? selected.paperId : null,
    true,
  );

  return (
    <ThreeColumnLayout
      list={
        <PaperList
          papers={papers}
          selectedId={selectedId}
          onSelect={setSelectedId}
          sectionTitle="Under Review"
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
                allReviewsComplete={allCriteriaMet}
                hasRebuttal={!!currentRebuttal}
                onOpenRebuttal={openRebuttal}
                isOpeningRebuttal={isOpeningRebuttal}
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
          <div className="p-6 text-center text-[#6a6050] font-serif text-sm">
            Select a paper to view review status
          </div>
        )
      }
    />
  );
}
