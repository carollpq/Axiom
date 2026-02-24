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
}

export interface ReviewCriterion {
  label: string;
  type: string;
}

export type { BadgeColorConfig as StageColorConfig } from "./shared";
export type { StatCardProps as JournalStatCardData } from "./shared";

export type PipelineCounts = Record<SubmissionStage, number>;
