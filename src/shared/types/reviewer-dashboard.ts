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

import type { TabConfig } from "./shared";

export type ReviewerTabConfig = TabConfig<ReviewerTab>;
