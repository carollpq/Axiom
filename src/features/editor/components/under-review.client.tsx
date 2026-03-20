'use client';

import dynamic from 'next/dynamic';
import { LazyFallback } from './lazy-fallback';
import { ThreeColumnLayout } from '@/src/shared/components/three-column-layout';
import { DecryptablePdfViewer } from '@/src/shared/components/decryptable-pdf-viewer.client';
import { PaperList } from '@/src/shared/components/paper-list.client';
import { ReviewStatusPanel } from './sidebar/review-status-panel';
import { RebuttalReasonPanel } from './sidebar/rebuttal-reason-panel';
import { useUnderReview } from '@/src/features/editor/hooks/useUnderReview';
import { useCollapseSidebar } from '@/src/shared/hooks/useCollapseSidebar';
import { SelectionPlaceholder } from '@/src/shared/components/selection-placeholder';
import { ConfirmDialog } from '@/src/shared/components/confirm-dialog.client';
import { useCallback } from 'react';
import { toast } from 'sonner';
import type {
  PaperCardData,
  PoolReviewer,
  ReviewerWithStatus,
  RebuttalInfo,
} from '@/src/features/editor/types';
import type { AuthorResponseStatusDb } from '@/src/shared/lib/db/schema';

const FinalDecisionPanel = dynamic(
  () =>
    import('./sidebar/final-decision-panel.client').then((m) => ({
      default: m.FinalDecisionPanel,
    })),
  { loading: LazyFallback },
);
const ResolveRebuttalPanel = dynamic(
  () =>
    import('./sidebar/resolve-rebuttal-panel.client').then((m) => ({
      default: m.ResolveRebuttalPanel,
    })),
  { loading: LazyFallback },
);
const AssignReviewersPanel = dynamic(
  () =>
    import('./sidebar/assign-reviewers-panel.client').then((m) => ({
      default: m.AssignReviewersPanel,
    })),
  { loading: LazyFallback },
);

const DECISION_LABELS: Record<string, string> = {
  accept: 'accept',
  reject: 'reject',
  revise: 'request revision for',
};

interface UnderReviewProps {
  papers: PaperCardData[];
  reviewerPool: PoolReviewer[];
  reviewStatuses: Record<string, ReviewerWithStatus[]>;
  authorResponseStatuses: Record<string, AuthorResponseStatusDb | null>;
  rebuttalsBySubmission?: Record<string, RebuttalInfo>;
}

export function UnderReviewClient({
  papers: initialPapers,
  reviewerPool,
  reviewStatuses,
  authorResponseStatuses,
  rebuttalsBySubmission,
}: UnderReviewProps) {
  useCollapseSidebar();
  const {
    papers,
    selectedId,
    setSelectedId,
    selected,
    additionalAssigned,
    assignReviewer,
    removeReviewer,
    reviewerSearch,
    setReviewerSearch,
    timelineDays,
    setTimelineDays,
    sendAdditionalInvites,
    isSendingInvites,
    decisionFlow: {
      currentReviewers,
      allReviewsComplete,
      currentAuthorResponseStatus,
      canMakeDecision,
      editorComment,
      setEditorComment,
      decision,
      setDecision,
      reviewerRatings,
      setReviewerRatings,
      releaseToAuthor,
      confirmRelease,
      isReleasingDecision,
      showDecisionConfirm,
      setShowDecisionConfirm,
    },
    rebuttalFlow: { currentRebuttal, resolveRebuttal, isResolvingRebuttal },
  } = useUnderReview({
    initialPapers,
    initialReviewerPool: reviewerPool,
    reviewStatuses,
    authorResponseStatuses,
    rebuttalsBySubmission,
  });

  const handleReviewerRatingChange = useCallback(
    (assignmentId: string, rating: number) => {
      setReviewerRatings((prev: Record<string, number>) => ({
        ...prev,
        [assignmentId]: rating,
      }));
    },
    [setReviewerRatings],
  );

  async function handleConfirmRelease() {
    const success = await confirmRelease();
    if (success) {
      toast.success('Decision released successfully');
    } else {
      toast.error('Failed to release decision. Please try again.');
    }
  }

  return (
    <>
      <ThreeColumnLayout
        title="Under Review"
        subtitle="Track review progress and make decisions"
        countLabel={`${papers.length} ${papers.length === 1 ? 'paper' : 'papers'}`}
        sidebarTitle="Review Status"
        list={
          <PaperList
            papers={papers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            emptyMessage="No papers in this stage."
          />
        }
        viewer={
          <DecryptablePdfViewer
            paperId={selected?.paperId}
            hasLitData={selected?.hasLitData}
            fallbackFileUrl={selected?.fileUrl}
            title={selected?.title}
          />
        }
        sidebar={
          selectedId ? (
            <>
              <ReviewStatusPanel reviewers={currentReviewers} />
              {currentRebuttal && (
                <RebuttalReasonPanel
                  authorReason={currentRebuttal.authorReason}
                  status={currentRebuttal.status}
                />
              )}
              {currentRebuttal && currentRebuttal.status === 'submitted' ? (
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
                  isLoading={isReleasingDecision}
                  reviewers={currentReviewers}
                  reviewerRatings={reviewerRatings}
                  onReviewerRatingChange={handleReviewerRatingChange}
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
                onTimelineChange={setTimelineDays}
                actionLabel="Assign"
                onAction={sendAdditionalInvites}
                isLoading={isSendingInvites}
              />
            </>
          ) : (
            <SelectionPlaceholder message="Select a paper to view review status" />
          )
        }
      />
      <ConfirmDialog
        isOpen={showDecisionConfirm}
        onClose={() => setShowDecisionConfirm(false)}
        onConfirm={handleConfirmRelease}
        title="Release Decision"
        message={`Are you sure you want to ${DECISION_LABELS[decision] ?? decision} this paper? This action cannot be undone.`}
        confirmLabel="Release"
        confirmVariant={decision === 'reject' ? 'red' : 'gold'}
        isLoading={isReleasingDecision}
        loadingLabel="Releasing..."
      />
    </>
  );
}
