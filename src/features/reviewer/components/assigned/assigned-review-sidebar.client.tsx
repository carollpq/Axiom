'use client';

import type { AssignedReviewExtended } from '@/src/features/reviewer/types/dashboard';
import type { DbAssignedReview } from '@/src/features/reviewer/queries';
import { useReviewWorkspace } from '@/src/features/reviewer/hooks/useReviewWorkspace';
import { CriteriaEvaluationSection } from '@/src/features/reviewer/review-workspace/criteria-evaluation-section';
import { GeneralCommentsSection } from '@/src/features/reviewer/review-workspace/general-comments-section.client';
import { RecommendationSection } from '@/src/features/reviewer/review-workspace/recommendation-section.client';
import { SubmissionActions } from '@/src/features/reviewer/review-workspace/submission-actions';
import { SubmissionConfirmation } from '@/src/features/reviewer/review-workspace/submission-confirmation';
import {
  getUrgencyColor,
  formatDaysLeft,
  SidebarField,
  TimelineRow,
} from '@/src/shared/components/sidebar-primitives';

interface AssignedReviewSidebarProps {
  paper: AssignedReviewExtended;
  rawAssignment: DbAssignedReview;
}

export function AssignedReviewSidebar({
  paper,
  rawAssignment,
}: AssignedReviewSidebarProps) {
  const urgencyColor = getUrgencyColor(paper.daysLeft);

  const {
    criteria,
    evaluations,
    generalComments,
    recommendation,
    isDraft,
    isSubmitted,
    submissionResult,
    completedCount,
    allCriteriaMet,
    canSubmit,
    setCriterionRating,
    setCriterionComment,
    setGeneralComment,
    setRecommendation,
    saveDraft,
    submitReview,
  } = useReviewWorkspace(rawAssignment);

  if (isSubmitted && submissionResult) {
    return (
      <div className="p-4">
        <SubmissionConfirmation result={submissionResult} />
      </div>
    );
  }

  const daysLeftText = formatDaysLeft(paper.daysLeft);

  return (
    <div className="p-4 space-y-6">
      <SidebarField label="Journal">
        <div className="sidebar-field-value--primary text-sm">
          {paper.journal}
        </div>
      </SidebarField>

      <SidebarField label="Editor">
        <div className="sidebar-field-value text-sm">{paper.editorName}</div>
      </SidebarField>

      <SidebarField label="Timeline">
        <div className="space-y-2">
          <TimelineRow label="Assigned" value={paper.assigned} />
          <TimelineRow label="Deadline" value={paper.deadline} />
          <TimelineRow
            label="Days remaining"
            value={daysLeftText}
            style={{ color: urgencyColor, fontWeight: 'bold' }}
          />
        </div>
      </SidebarField>

      <SidebarField label="Status">
        <span
          className="inline-block text-[11px] px-2 py-1 rounded"
          style={{ backgroundColor: `${urgencyColor}20`, color: urgencyColor }}
        >
          {paper.status}
        </span>
      </SidebarField>

      <div className="sidebar-divider" />

      <div>
        <h3
          className="text-sm font-serif font-normal m-0 mb-4"
          style={{ color: '#e8e0d4' }}
        >
          Review Form
        </h3>

        <CriteriaEvaluationSection
          criteria={criteria}
          evaluations={evaluations}
          completedCount={completedCount}
          onRatingChange={setCriterionRating}
          onCommentChange={setCriterionComment}
        />

        <GeneralCommentsSection
          comments={generalComments}
          onChange={setGeneralComment}
        />

        <RecommendationSection
          recommendation={recommendation}
          allCriteriaMet={allCriteriaMet}
          onChange={setRecommendation}
        />

        <SubmissionActions
          canSubmit={canSubmit}
          isDraft={isDraft}
          onSaveDraft={saveDraft}
          onSubmit={submitReview}
        />
      </div>
    </div>
  );
}
