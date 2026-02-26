"use client";

import { ThreeColumnLayout } from "@/src/shared/components/ThreeColumnLayout";
import { PdfViewerPlaceholder } from "@/src/shared/components/PdfViewerPlaceholder";
import { PaperList } from "./PaperList.client";
import { ReviewStatusPanel } from "./sidebar/ReviewStatusPanel";
import { FinalDecisionPanel } from "./sidebar/FinalDecisionPanel";
import { AssignReviewersPanel } from "./sidebar/AssignReviewersPanel";
import { useUnderReview } from "@/src/features/editor/hooks/useUnderReview";
import type {
  PaperCardData,
  PoolReviewer,
  ReviewerWithStatus,
} from "@/src/shared/types/editor-dashboard";

interface UnderReviewProps {
  papers: PaperCardData[];
  reviewerPool: PoolReviewer[];
  reviewStatuses: Record<string, ReviewerWithStatus[]>;
}

export function UnderReviewClient({
  papers,
  reviewerPool,
  reviewStatuses,
}: UnderReviewProps) {
  const {
    selectedId,
    setSelectedId,
    selected,
    currentReviewers,
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
  } = useUnderReview(papers, reviewerPool, reviewStatuses);

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
      viewer={<PdfViewerPlaceholder title={selected?.title} />}
      sidebar={
        selectedId ? (
          <>
            <ReviewStatusPanel reviewers={currentReviewers} />
            <FinalDecisionPanel
              comment={editorComment}
              onCommentChange={setEditorComment}
              decision={decision}
              onDecisionChange={setDecision}
              onRelease={releaseToAuthor}
            />
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
