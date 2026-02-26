"use client";

import { useReviewWorkspace } from "@/src/shared/hooks/useReviewWorkspace";
import type { DbReviewAssignment } from "@/src/features/reviews/queries";
import {
  MethodologyBanner,
  PaperPanel,
  ProvenanceView,
  CriteriaSidebar,
  CriteriaEvaluationSection,
  GeneralCommentsSection,
  RecommendationSection,
  SubmissionActions,
  SubmissionConfirmation,
} from "@/src/features/reviewer/review-workspace";

interface ReviewWorkspaceClientProps {
  assignment: NonNullable<DbReviewAssignment>;
}

export function ReviewWorkspaceClient({ assignment }: ReviewWorkspaceClientProps) {
  const {
    paper,
    criteria,
    evaluations,
    generalComments,
    recommendation,
    isDraft,
    isSubmitted,
    submissionResult,
    criteriaCollapsed,
    setCriteriaCollapsed,
    completedCount,
    allCriteriaMet,
    canSubmit,
    setCriterionRating,
    setCriterionComment,
    setGeneralComment,
    setRecommendation,
    saveDraft,
    submitReview,
  } = useReviewWorkspace(assignment);

  return (
    <main className="max-w-7xl mx-auto px-10 py-8">
      {/* Breadcrumb */}
      <div className="text-xs mb-6" style={{ color: "#6a6050" }}>
        <a href="/reviewer" style={{ color: "#8a8070" }}>
          Dashboard
        </a>
        <span className="mx-2">/</span>
        <span>Review Workspace</span>
      </div>

      <h1
        className="text-2xl font-serif font-normal italic m-0 mb-2"
        style={{ color: "#e8e0d4" }}
      >
        Review Workspace
      </h1>
      <p className="text-sm italic mb-8" style={{ color: "#6a6050" }}>
        Evaluate paper against journal-published criteria
      </p>

      {isSubmitted && submissionResult ? (
        <SubmissionConfirmation result={submissionResult} />
      ) : (
        <div
          className="grid gap-8"
          style={{ gridTemplateColumns: "1fr 300px" }}
        >
          {/* Main column */}
          <div>
            <MethodologyBanner />
            <PaperPanel paper={paper} />
            <ProvenanceView provenance={paper.provenance} />
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

          {/* Right sidebar */}
          <div>
            <div className="sticky top-20">
              <CriteriaSidebar
                criteria={criteria}
                collapsed={criteriaCollapsed}
                onToggle={() => setCriteriaCollapsed(!criteriaCollapsed)}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
