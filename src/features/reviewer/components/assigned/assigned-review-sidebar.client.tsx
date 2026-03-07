'use client';

import type { AssignedReviewExtended } from '@/src/features/reviewer/types';
import type { DbAssignedReview } from '@/src/features/reviewer/queries';
import { useReviewWorkspace } from '@/src/features/reviewer/hooks/useReviewWorkspace';
import { CriteriaEvaluationSection } from '@/src/features/reviewer/review-workspace/CriteriaEvaluationSection';
import { GeneralCommentsSection } from '@/src/features/reviewer/review-workspace/GeneralCommentsSection';
import { RecommendationSection } from '@/src/features/reviewer/review-workspace/RecommendationSection';
import { SubmissionActions } from '@/src/features/reviewer/review-workspace/SubmissionActions';
import { SubmissionConfirmation } from '@/src/features/reviewer/review-workspace/SubmissionConfirmation';

interface AssignedReviewSidebarProps {
  paper: AssignedReviewExtended;
  rawAssignment: DbAssignedReview;
}

const labelStyle: React.CSSProperties = { color: '#6a6050' };
const valueStyle: React.CSSProperties = { color: '#b0a898' };

function getUrgencyColor(daysLeft: number): string {
  if (daysLeft < 0) return '#d4645a';
  if (daysLeft <= 3) return '#c9a44a';
  return '#8fbc8f';
}

function SidebarField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="text-[10px] uppercase tracking-[1.5px] mb-2"
        style={labelStyle}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function TimelineRow({
  label,
  value,
  style,
}: {
  label: string;
  value: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="flex justify-between text-[12px]">
      <span style={{ color: '#8a8070' }}>{label}</span>
      <span style={style ?? valueStyle}>{value}</span>
    </div>
  );
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

  const daysLeftText =
    paper.daysLeft < 0
      ? `${Math.abs(paper.daysLeft)} days overdue`
      : `${paper.daysLeft} days`;

  return (
    <div className="p-4 space-y-6">
      <SidebarField label="Journal">
        <div className="text-sm font-serif" style={{ color: '#d4ccc0' }}>
          {paper.journal}
        </div>
      </SidebarField>

      <SidebarField label="Editor">
        <div className="text-sm" style={valueStyle}>
          {paper.editorName}
        </div>
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

      <div style={{ borderTop: '1px solid rgba(120,110,95,0.2)' }} />

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
