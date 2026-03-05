export type SubmissionDisplayStatus = string;

export interface SubmissionCard {
  id: string;
  paperId: string;
  paperTitle: string;
  journalName: string;
  authors: string;
  submittedAt: string;
  status: SubmissionDisplayStatus;
  reviewerCount?: number;
  completedReviewCount?: number;
  totalReviewCount?: number;
}

export interface DashboardStats {
  newSubmissions: number;
  underReview: number;
  reviewsPending: number;
  accepted: number;
  rejected: number;
}

import type { LucideIcon } from "lucide-react";

export interface StatCardData {
  label: string;
  value: string;
  icon: LucideIcon;
}

export type { NavItemData, UserProfile } from "@/src/shared/types/shared";
