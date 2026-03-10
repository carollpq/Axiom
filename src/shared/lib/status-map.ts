import type {
  PaperStatusDb,
  SubmissionStatusDb,
} from '@/src/shared/lib/db/schema';

export type PaperStatus =
  | 'Published'
  | 'Under Review'
  | 'Reviews Complete'
  | 'Viewed By Editor'
  | 'Contract Pending'
  | 'Revision Requested'
  | 'Rebuttal Phase'
  | 'Criteria Published'
  | 'Reviewers Assigned'
  | 'Accepted'
  | 'Rejected'
  | 'Retracted'
  | 'Draft'
  | 'Submitted';

/** Maps DB paper/submission status → frontend display string */
const statusMap: Record<PaperStatusDb | SubmissionStatusDb, PaperStatus> = {
  draft: 'Draft',
  registered: 'Draft',
  contract_pending: 'Contract Pending',
  submitted: 'Submitted',
  viewed_by_editor: 'Viewed By Editor',
  criteria_published: 'Criteria Published',
  reviewers_assigned: 'Reviewers Assigned',
  under_review: 'Under Review',
  reviews_completed: 'Reviews Complete',
  rebuttal_open: 'Rebuttal Phase',
  revision_requested: 'Revision Requested',
  accepted: 'Accepted',
  rejected: 'Rejected',
  published: 'Published',
  retracted: 'Retracted',
};

export function toDisplayStatus(
  dbStatus: PaperStatusDb | SubmissionStatusDb,
): PaperStatus {
  return statusMap[dbStatus] ?? 'Draft';
}

/** Maps frontend display string → DB enum(s) for filtering */
const reverseMap: Record<PaperStatus, string[]> = {
  Draft: ['draft', 'registered'],
  'Contract Pending': ['contract_pending'],
  Submitted: ['submitted'],
  'Viewed By Editor': ['viewed_by_editor'],
  'Criteria Published': ['criteria_published'],
  'Reviewers Assigned': ['reviewers_assigned'],
  'Under Review': ['under_review'],
  'Reviews Complete': ['reviews_completed'],
  'Revision Requested': ['revision_requested'],
  'Rebuttal Phase': ['rebuttal_open'],
  Accepted: ['accepted'],
  Rejected: ['rejected'],
  Retracted: ['retracted'],
  Published: ['published'],
};

export function toDbStatuses(displayStatus: PaperStatus): string[] {
  return reverseMap[displayStatus];
}
