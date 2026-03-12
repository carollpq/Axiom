import { CriteriaBadge } from '@/src/shared/components/criteria-badge';

export interface ReviewCriterion {
  id: string;
  label: string;
  description?: string;
}

interface Props {
  criteriaEvaluations: string | null;
  strengths: string | null;
  weaknesses: string | null;
  questionsForAuthors: string | null;
  recommendation: string | null;
  criteria: ReviewCriterion[];
  label: string;
}

export function ReviewContent({
  criteriaEvaluations,
  strengths,
  weaknesses,
  questionsForAuthors,
  recommendation,
  criteria,
  label,
}: Props) {
  let evaluations: Record<string, { rating: string; comment?: string }> = {};
  try {
    evaluations = criteriaEvaluations ? JSON.parse(criteriaEvaluations) : {};
  } catch {
    // ignore parse errors
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-serif text-[#c9a44a]">{label}</h2>
        <span className="text-[11px] text-[#6a6050]">
          Recommendation: {recommendation ?? '—'}
        </span>
      </div>

      {/* Criteria evaluations */}
      {criteria.length > 0 && Object.keys(evaluations).length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-2">
            Criteria Evaluations
          </div>
          {criteria.map((c) => {
            const ev = evaluations[c.id];
            return (
              <div
                key={c.id}
                className="flex gap-3 items-start mb-2 text-[12px]"
              >
                <CriteriaBadge rating={ev?.rating} />
                <div>
                  <span className="text-[#b0a898]">{c.label}</span>
                  {ev?.comment && (
                    <p className="text-[#6a6050] mt-0.5">{ev.comment}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Strengths / Weaknesses / Questions */}
      {strengths && (
        <div className="mb-3">
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-1">
            Strengths
          </div>
          <p className="text-[12px] text-[#b0a898]">{strengths}</p>
        </div>
      )}
      {weaknesses && (
        <div className="mb-3">
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-1">
            Weaknesses
          </div>
          <p className="text-[12px] text-[#b0a898]">{weaknesses}</p>
        </div>
      )}
      {questionsForAuthors && (
        <div className="mb-4">
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-1">
            Questions for Authors
          </div>
          <p className="text-[12px] text-[#b0a898]">{questionsForAuthors}</p>
        </div>
      )}
    </>
  );
}

export default ReviewContent;
