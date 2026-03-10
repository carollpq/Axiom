import type {
  ReviewCriterion,
  CriterionRating,
  CriterionEvaluation as CriterionEvalType,
} from '@/src/features/reviewer/types';
import { CriterionEvaluation } from './criterion-evaluation.client';

interface CriteriaEvaluationSectionProps {
  criteria: ReviewCriterion[];
  evaluations: Record<number, CriterionEvalType>;
  completedCount: number;
  onRatingChange: (id: number, rating: CriterionRating) => void;
  onCommentChange: (id: number, comment: string) => void;
}

export function CriteriaEvaluationSection({
  criteria,
  evaluations,
  completedCount,
  onRatingChange,
  onCommentChange,
}: CriteriaEvaluationSectionProps) {
  const total = criteria.length;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-base font-serif font-normal m-0"
          style={{ color: '#e8e0d4' }}
        >
          Criteria Evaluation
        </h3>
        <span className="text-xs" style={{ color: '#8a8070' }}>
          {completedCount} of {total} completed
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 rounded-full mb-4 overflow-hidden"
        style={{ background: 'rgba(120,110,95,0.2)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${(completedCount / total) * 100}%`,
            background:
              completedCount === total
                ? 'linear-gradient(90deg, #8fbc8f, #a0d0a0)'
                : 'linear-gradient(90deg, #c9a44a, #d4b85a)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {criteria.map((c, i) => (
        <CriterionEvaluation
          key={c.id}
          criterion={c}
          evaluation={evaluations[c.id]}
          index={i}
          onRatingChange={onRatingChange}
          onCommentChange={onCommentChange}
        />
      ))}
    </div>
  );
}
