import type { TabConfig } from "@/src/shared/types/shared";

// ── Reviewer Dashboard Types ──

export type ReviewStatus = "Late" | "In Progress" | "Pending" | "Submitted";

export type ReviewerTab = "assigned" | "completed" | "feedback";

export interface AssignedReview {
  id: number;
  assignmentId?: string;
  title: string;
  journal: string;
  assigned: string;
  deadline: string;
  status: ReviewStatus;
  daysLeft: number;
}

export interface CompletedReview {
  id: number;
  title: string;
  journal: string;
  submitted: string;
  editorRating: number;
  authorRating: number;
  hash: string;
}

export interface FeedbackItem {
  reviewId: number;
  usefulness: number;
  comment: string;
}

export interface ReputationDataPoint {
  month: string;
  score: number;
}

export interface ReputationBreakdownItem {
  label: string;
  value: number;
  desc: string;
}

export interface ReputationScores {
  overall: number;
  change: number;
  timeliness: number;
  editorAvg: number;
  authorAvg: number;
  postPub: number;
}

export type ReviewerTabConfig = TabConfig<ReviewerTab>;

// ── Review Workspace Types ──

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
