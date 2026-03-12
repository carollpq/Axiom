export type SubmissionDisplayStatus =
  | 'Paper Submitted'
  | 'Viewed By Editor'
  | 'Rejected'
  | 'Desk Reject'
  | 'All Reviews Completed'
  | 'Reviews Sent to Editor'
  | 'Rebuttal Phase'
  | 'Accepted'
  | `Assigned ${number} Reviewer`
  | `Assigned ${number} Reviewers`
  | `${number}/${number} Reviews Completed`;

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

export type { NavItemData, UserProfile } from '@/src/shared/types/shared';
