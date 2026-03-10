export type PaperStatus =
  | 'Published'
  | 'Under Review'
  | 'Reviews Complete'
  | 'Viewed By Editor'
  | 'Contract Pending'
  | 'Revision Requested'
  | 'Draft'
  | 'Submitted';

/** Maps DB paper_status enum -> frontend display string (author dashboard context) */
const statusMap: Record<string, PaperStatus> = {
  draft: 'Draft',
  registered: 'Draft',
  contract_pending: 'Contract Pending',
  submitted: 'Submitted',
  viewed_by_editor: 'Viewed By Editor',
  under_review: 'Under Review',
  reviews_completed: 'Reviews Complete',
  revision_requested: 'Revision Requested',
  published: 'Published',
  retracted: 'Draft',
};

export function toDisplayStatus(dbStatus: string): PaperStatus {
  return statusMap[dbStatus] ?? 'Draft';
}

/** Maps frontend display string -> DB enum for filtering */
const reverseMap: Record<PaperStatus, string[]> = {
  Draft: ['draft', 'registered'],
  'Contract Pending': ['contract_pending'],
  Submitted: ['submitted'],
  'Viewed By Editor': ['viewed_by_editor'],
  'Under Review': ['under_review'],
  'Reviews Complete': ['reviews_completed'],
  'Revision Requested': ['revision_requested'],
  Published: ['published'],
};

export function toDbStatuses(displayStatus: PaperStatus): string[] {
  return reverseMap[displayStatus] ?? [displayStatus.toLowerCase()];
}
