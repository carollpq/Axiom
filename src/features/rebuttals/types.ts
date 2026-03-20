export interface ReviewForRebuttal {
  id: string;
  anonymousLabel: string;
  criteriaEvaluations: string | null;
  strengths: string | null;
  weaknesses: string | null;
  questionsForAuthors: string | null;
  recommendation: string | null;
}

export interface RebuttalResponse {
  id: string;
  reviewId: string;
  criterionId?: string;
  position: 'agree' | 'disagree';
  justification: string;
  evidence?: string;
}

export interface RebuttalData {
  id: string;
  submissionId: string;
  status: 'open' | 'submitted' | 'under_review' | 'resolved';
  authorReason: string | null;
  deadline: string;
  resolution?: 'upheld' | 'rejected' | 'partial' | null;
  editorNotes?: string | null;
  responses: RebuttalResponse[];
  createdAt: string;
}
