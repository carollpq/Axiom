import type { TabConfig } from '@/src/shared/types/shared';
import type {
  AuthorResponseStatusDb,
  RebuttalStatusDb,
  RebuttalResolutionDb,
  RebuttalPositionDb,
} from '@/src/shared/lib/db/schema';

export type ReviewerDisplayStatus =
  | 'Late'
  | 'In Progress'
  | 'Pending'
  | 'Submitted';

export type ReviewerTab = 'dashboard' | 'invites' | 'assigned' | 'completed';

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
  paperId?: string;
  pdfUrl?: string;
  hasLitData?: boolean;
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

export interface CompletedReviewExtended extends CompletedReview {
  assignmentId?: string;
  submissionId?: string;
  abstract?: string;
  authors?: string[];
  paperId?: string;
  pdfUrl?: string;
  hasLitData?: boolean;
  editorName?: string;
  reviewContent?: {
    strengths?: string;
    weaknesses?: string;
    questionsForAuthors?: string;
    recommendation?: string;
  };
  authorResponseStatus?: AuthorResponseStatusDb;
  rebuttal?: {
    status: RebuttalStatusDb;
    resolution?: RebuttalResolutionDb;
    editorNotes?: string;
    responseForThisReview?: {
      position: RebuttalPositionDb;
      justification: string;
    };
  };
}

export interface ResearcherInsight {
  reviewId: string;
  comment: string;
  overallRating: number;
  createdAt: string;
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
