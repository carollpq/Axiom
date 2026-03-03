export type SubmissionStage =
  | "New"
  | "Criteria Published"
  | "Reviewers Assigned"
  | "Under Review"
  | "Decision Pending"
  | "Published"
  | "Rejected";

export type StageFilter = "All" | SubmissionStage;

export type DetailTab = "info" | "criteria" | "reviewers" | "decision";

export type ViewMode = "table" | "kanban";

export interface JournalSubmission {
  id: number;
  title: string;
  authors: string;
  submitted: string;
  stage: SubmissionStage;
  reviewers: string[];
  deadline: string | null;
  criteriaPublished: boolean;
  criteriaMet: boolean | null;
  hash: string;
}

export interface PoolReviewer {
  id: string;
  name: string;
  field: string;
  score: number;
  orcid: string;
  reviews: number;
  wallet?: string;
}

export interface ReviewCriterion {
  label: string;
  type: string;
}

export type { BadgeColorConfig as StageColorConfig } from "@/src/shared/types/shared";
export type { StatCardProps as JournalStatCardData } from "@/src/shared/types/shared";

export type PipelineCounts = Record<SubmissionStage, number>;

/* ── New types for the redesigned editor views ── */

export interface PaperCardData {
  id: string;
  title: string;
  authors: string;
  abstractSnippet: string;
  submittedDate: string;
  fileUrl?: string;
}

export type ReviewStatus = "complete" | "in_progress" | "rejected" | "pending";

export interface ReviewerWithStatus {
  id: string;
  name: string;
  status: ReviewStatus;
  hasComment: boolean;
}

export interface EditorProfile {
  name: string;
  initials: string;
  affiliation: string;
  journalName: string;
}

export interface JournalIssue {
  id: string;
  label: string;
  paperCount: number;
}
