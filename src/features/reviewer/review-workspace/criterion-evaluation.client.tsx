'use client';

import type {
  ReviewCriterion,
  CriterionRating,
  CriterionEvaluation as CriterionEvalType,
} from '@/src/features/reviewer/types/workspace';
import { getStatusColors } from '@/src/shared/lib/status-colors';

interface CriterionEvaluationProps {
  criterion: ReviewCriterion;
  evaluation: CriterionEvalType;
  index: number;
  onRatingChange: (id: number, rating: CriterionRating) => void;
  onCommentChange: (id: number, comment: string) => void;
}

const RATINGS: CriterionRating[] = ['Yes', 'No', 'Partially'];

export function CriterionEvaluation({
  criterion,
  evaluation,
  index,
  onRatingChange,
  onCommentChange,
}: CriterionEvaluationProps) {
  return (
    <div
      className="rounded-lg p-4 mb-3"
      style={{
        background: 'rgba(45,42,38,0.5)',
        border: '1px solid rgba(120,110,95,0.15)',
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="text-sm" style={{ color: '#d4ccc0' }}>
          <span style={{ color: '#6a6050' }}>{index + 1}.</span>{' '}
          {criterion.text}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {RATINGS.map((r) => {
            const active = evaluation.rating === r;
            const colors = getStatusColors(r);
            return (
              <button
                key={r}
                onClick={() => onRatingChange(criterion.id, r)}
                className="text-xs px-3 py-1.5 rounded cursor-pointer font-serif"
                style={{
                  background: active ? colors.bg : 'rgba(30,28,24,0.5)',
                  color: active ? colors.text : '#6a6050',
                  border: active
                    ? `1px solid ${colors.border}`
                    : '1px solid rgba(120,110,95,0.15)',
                }}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>
      <textarea
        placeholder="Optional comment on this criterion..."
        value={evaluation.comment}
        onChange={(e) => onCommentChange(criterion.id, e.target.value)}
        rows={2}
        className="input-field resize-y text-[12px] py-2 px-3"
      />
    </div>
  );
}
