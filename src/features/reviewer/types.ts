import type { TabConfig } from "@/src/shared/types/shared";

// ── Reviewer Dashboard Types ──

export type ReviewerDisplayStatus = "Late" | "In Progress" | "Pending" | "Submitted";

export type ReviewerTab = "dashboard" | "invites" | "assigned" | "completed";

export interface AssignedReview {
  id: number;
  assignmentId?: string;
  submissionId?: string;
  title: string;
  journal: string;
  assigned: string;
  deadline: string;
  status: ReviewerDisplayStatus;
  daysLeft: number;
}

export interface AssignedReviewExtended extends AssignedReview {
  abstract?: string;
  authors?: string[];
  pdfUrl?: string;
  editorName?: string;
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
  protocols?: {
    actionableFeedback: number;
    deepEngagement: number;
    fairObjective: number;
    justifiedRecommendation: number;
    appropriateExpertise: number;
  };
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

export interface UserProfile {
  id?: string;
  walletAddress?: string;
  displayName?: string | null;
  institution?: string | null;
  orcidId?: string | null;
  researchFields?: string[];
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
