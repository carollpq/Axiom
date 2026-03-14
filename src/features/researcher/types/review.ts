export interface AnonymizedReview {
  id: string;
  label: string;
  criteriaEvaluations: string | null;
  strengths: string | null;
  weaknesses: string | null;
  questionsForAuthors: string | null;
  recommendation: string | null;
  submittedAt?: string;
}

export interface ReviewerInfo {
  assignmentId: string;
  label: string;
  status: 'in_progress' | 'complete';
  reviewId?: string;
}

export interface ProtocolRatings {
  actionableFeedback: number;
  deepEngagement: number;
  fairObjective: number;
  justifiedRecommendation: number;
  appropriateExpertise: number;
}
