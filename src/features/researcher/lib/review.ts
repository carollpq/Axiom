import type { AnonymizedReview } from '@/src/features/researcher/types/review';

function normalizeTimestamp(
  value: string | Date | null | undefined,
): string | undefined {
  if (!value) return undefined;
  return typeof value === 'string' ? value : value.toISOString();
}

/**
 * Strips reviewer identity and confidential comments from review rows.
 * Returns a consistent anonymized shape used across view-submissions,
 * review-response, and rebuttal pages.
 */
export function anonymizeReviews(
  reviews: readonly {
    id: string;
    criteriaEvaluations: string | null;
    strengths: string | null;
    weaknesses: string | null;
    questionsForAuthors: string | null;
    recommendation: string | null;
    submittedAt?: string | Date | null;
  }[],
): AnonymizedReview[] {
  return reviews.map((r, idx) => ({
    id: r.id,
    label: `Reviewer ${String.fromCharCode(65 + idx)}`,
    criteriaEvaluations: r.criteriaEvaluations,
    strengths: r.strengths,
    weaknesses: r.weaknesses,
    questionsForAuthors: r.questionsForAuthors,
    recommendation: r.recommendation,
    submittedAt: normalizeTimestamp(r.submittedAt),
  }));
}
