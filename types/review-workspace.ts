export type CriterionRating = "Yes" | "No" | "Partially";

export type Recommendation = "Accept" | "Minor Revisions" | "Major Revisions" | "Reject";

export interface ProvenanceEntry {
  label: string;
  hash: string;
  url?: string;
  verified: boolean;
}

export interface PaperUnderReview {
  id: number;
  title: string;
  abstract: string;
  journal: string;
  version: string;
  anonymized: boolean;
  pdfUrl: string;
  provenance: ProvenanceEntry[];
}

export interface ReviewCriterion {
  id: number;
  text: string;
  onChainHash: string;
}

export interface CriterionEvaluation {
  criterionId: number;
  rating: CriterionRating | null;
  comment: string;
}

export interface GeneralComments {
  strengths: string;
  weaknesses: string;
  questionsForAuthors: string;
  confidentialEditorComments: string;
}

export interface SubmissionResult {
  txHash: string;
  timestamp: string;
  paperHash: string;
  reviewHash: string;
  criteriaSummary: {
    met: number;
    partial: number;
    notMet: number;
  };
}
