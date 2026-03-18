import type {
  RebuttalData,
  RebuttalResponse,
} from '@/src/features/rebuttals/types';

export type SubmissionStage =
  | 'New'
  | 'Criteria Published'
  | 'Reviewers Assigned'
  | 'Under Review'
  | 'Decision Pending'
  | 'Published'
  | 'Rejected';

export type StageFilter = 'All' | SubmissionStage;

export type DetailTab = 'info' | 'criteria' | 'reviewers' | 'decision';

export type ViewMode = 'table' | 'kanban';

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
  wallet: string;
  institution: string;
  poolInviteStatus?: 'pending' | 'accepted' | 'rejected';
}

export type { BadgeColorConfig } from '@/src/shared/types/shared';
export type { StatCardProps as JournalStatCardData } from '@/src/shared/types/shared';

export type PipelineCounts = Record<SubmissionStage, number>;

/* ── New types for the redesigned editor views ── */

export interface PaperCardData {
  id: string;
  paperId: string;
  title: string;
  authors: string;
  abstractSnippet: string;
  submittedDate: string;
  hasLitData: boolean;
  fileUrl?: string;
  criteriaPublished: boolean;
  criteriaTxId?: string;
}

export type AssignmentDisplayStatus =
  | 'complete'
  | 'in_progress'
  | 'late'
  | 'rejected'
  | 'pending';

export interface ReviewerWithStatus {
  id: string;
  name: string;
  status: AssignmentDisplayStatus;
  hasComment: boolean;
  reviewContent?: ReviewCommentData;
}

export interface ReviewCommentData {
  strengths: string | null;
  weaknesses: string | null;
  recommendation: string | null;
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
  papers?: Array<{ submissionId: string; title: string }>;
}

export type RebuttalResponseInfo = Pick<
  RebuttalResponse,
  'reviewId' | 'position' | 'justification'
>;

export type RebuttalInfo = Pick<
  RebuttalData,
  'id' | 'submissionId' | 'status'
> & {
  responses: RebuttalResponseInfo[];
};
