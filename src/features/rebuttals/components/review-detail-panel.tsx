import { SectionLabel } from '@/src/shared/components/section-label';
import { ReviewField } from '@/src/shared/components/review-field';
import type { ReviewForRebuttal } from '@/src/features/rebuttals/types';

type ReviewDetail = Pick<
  ReviewForRebuttal,
  | 'anonymousLabel'
  | 'recommendation'
  | 'strengths'
  | 'weaknesses'
  | 'questionsForAuthors'
  | 'criteriaEvaluations'
>;

interface ReviewDetailPanelProps {
  review: ReviewDetail | undefined;
}

export function ReviewDetailPanel({ review }: ReviewDetailPanelProps) {
  if (!review) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-center text-[#6a6050] font-serif mt-20">
          Select a review to view and respond
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[700px]">
        <h2 className="text-[18px] text-[#e8e0d4] font-serif mb-4">
          {review.anonymousLabel}
        </h2>

        {review.recommendation && (
          <div className="mb-4">
            <SectionLabel className="mb-1">Recommendation</SectionLabel>
            <div className="text-[13px] text-[#d4ccc0] font-serif capitalize">
              {review.recommendation}
            </div>
          </div>
        )}

        <ReviewField label="Strengths" value={review.strengths} />
        <ReviewField label="Weaknesses" value={review.weaknesses} />
        <ReviewField
          label="Questions for Authors"
          value={review.questionsForAuthors}
        />
        <ReviewField
          label="Criteria Evaluations"
          value={review.criteriaEvaluations}
        />
      </div>
    </div>
  );
}
