import { pgTable, text, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export type PaperStatusDb =
  | 'draft'
  | 'registered'
  | 'contract_pending'
  | 'submitted'
  | 'under_review'
  | 'revision_requested'
  | 'published';

export type StudyTypeDb =
  | 'original'
  | 'meta_analysis'
  | 'negative_result'
  | 'replication'
  | 'replication_failed';

export type ContractStatusDb =
  | 'draft'
  | 'pending_signatures'
  | 'fully_signed'
  | 'voided';

export type ContributorStatusDb = 'pending' | 'signed' | 'declined';

export type SubmissionStatusDb =
  | 'submitted'
  | 'viewed_by_editor'
  | 'criteria_published'
  | 'reviewers_assigned'
  | 'under_review'
  | 'reviews_completed'
  | 'rebuttal_open'
  | 'revision_requested'
  | 'accepted'
  | 'rejected'
  | 'published';

export type AuthorResponseStatusDb =
  | 'pending'
  | 'accepted'
  | 'rebuttal_requested';

export type ReviewAssignmentStatusDb =
  | 'assigned'
  | 'accepted'
  | 'declined'
  | 'submitted'
  | 'late';

export type ReputationEventTypeDb =
  | 'review_completed'
  | 'review_late'
  | 'editor_rating'
  | 'author_rating'
  | 'paper_published'
  | 'rebuttal_upheld'
  | 'rebuttal_overturned';

export type RebuttalStatusDb =
  | 'open'
  | 'submitted'
  | 'under_review'
  | 'resolved';

export type RebuttalResolutionDb = 'upheld' | 'rejected' | 'partial';

export type RebuttalPositionDb = 'agree' | 'disagree';

export type PoolInviteStatusDb = 'pending' | 'accepted' | 'rejected';

export type BadgeTypeDb =
  | 'first_review'
  | 'five_reviews'
  | 'ten_reviews'
  | 'twentyfive_reviews'
  | 'high_reputation'
  | 'timely_reviewer';

export type NotificationTypeDb =
  | 'reviewers_assigned'
  | 'criteria_published'
  | 'review_submitted'
  | 'decision_made'
  | 'rebuttal_opened'
  | 'rebuttal_submitted'
  | 'rebuttal_resolved'
  | 'review_late'
  | 'rating_received'
  | 'submission_viewed'
  | 'reviews_completed'
  | 'author_response'
  | 'assignment_accepted'
  | 'assignment_declined'
  | 'contributor_added'
  | 'contract_signed'
  | 'contract_fully_signed'
  | 'pool_added'
  | 'pool_invite_accepted'
  | 'pool_invite_rejected'
  | 'paper_published';

// ── Tables ─────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  walletAddress: text('wallet_address').notNull().unique(),
  did: text('did'),
  displayName: text('display_name'),
  institution: text('institution'),
  orcidId: text('orcid_id'),
  roles: jsonb('roles').notNull().$type<string[]>().default([]),
  researchFields: jsonb('research_fields')
    .notNull()
    .$type<string[]>()
    .default([]),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`now()`),
});

export const papers = pgTable('papers', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  abstract: text('abstract'),
  status: text('status').notNull().$type<PaperStatusDb>().default('draft'),
  studyType: text('study_type')
    .notNull()
    .$type<StudyTypeDb>()
    .default('original'),
  currentVersion: integer('current_version').notNull().default(1),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id),
  litDataToEncryptHash: text('lit_data_to_encrypt_hash'),
  litAccessConditionsJson: text('lit_access_conditions_json'),
  hederaTxId: text('hedera_tx_id'),
  hederaTimestamp: text('hedera_timestamp'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`now()`),
});

export const paperVersions = pgTable('paper_versions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  paperId: text('paper_id')
    .notNull()
    .references(() => papers.id),
  versionNumber: integer('version_number').notNull(),
  paperHash: text('paper_hash').notNull(),
  datasetHash: text('dataset_hash'),
  codeRepoUrl: text('code_repo_url'),
  codeCommitHash: text('code_commit_hash'),
  envSpecHash: text('env_spec_hash'),
  fileStorageKey: text('file_storage_key'),
  hederaTxId: text('hedera_tx_id'),
  hederaTimestamp: text('hedera_timestamp'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
});

export const authorshipContracts = pgTable('authorship_contracts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  paperId: text('paper_id').references(() => papers.id),
  paperTitle: text('paper_title').notNull(),
  contractHash: text('contract_hash'),
  status: text('status').notNull().$type<ContractStatusDb>().default('draft'),
  version: integer('version').notNull().default(1),
  creatorId: text('creator_id')
    .notNull()
    .references(() => users.id),
  hederaTxId: text('hedera_tx_id'),
  hederaTimestamp: text('hedera_timestamp'),
  hederaScheduleId: text('hedera_schedule_id'),
  hederaScheduleTxId: text('hedera_schedule_tx_id'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`now()`),
});

export const contractContributors = pgTable('contract_contributors', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  contractId: text('contract_id')
    .notNull()
    .references(() => authorshipContracts.id),
  contributorWallet: text('contributor_wallet').notNull(),
  contributorName: text('contributor_name'),
  contributionPct: integer('contribution_pct').notNull(),
  roleDescription: text('role_description'),
  signature: text('signature'),
  status: text('status')
    .notNull()
    .$type<ContributorStatusDb>()
    .default('pending'),
  isCreator: boolean('is_creator').notNull().default(false),
  signedAt: text('signed_at'),
  hederaScheduleSignTxId: text('hedera_schedule_sign_tx_id'),
  inviteToken: text('invite_token').unique(),
  inviteExpiresAt: text('invite_expires_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
});

export const journals = pgTable('journals', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  editorWallet: text('editor_wallet').notNull(),
  reputationScore: text('reputation_score').default('4.3'),
  aimsAndScope: text('aims_and_scope'),
  submissionCriteria: text('submission_criteria'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`now()`),
});

export const journalIssues = pgTable('journal_issues', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  journalId: text('journal_id')
    .notNull()
    .references(() => journals.id),
  label: text('label').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
});

export const issuePapers = pgTable('issue_papers', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  issueId: text('issue_id')
    .notNull()
    .references(() => journalIssues.id),
  submissionId: text('submission_id')
    .notNull()
    .references(() => submissions.id),
  addedAt: text('added_at')
    .notNull()
    .default(sql`now()`),
});

export const journalReviewers = pgTable('journal_reviewers', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  journalId: text('journal_id')
    .notNull()
    .references(() => journals.id),
  reviewerWallet: text('reviewer_wallet').notNull(),
  status: text('status')
    .$type<PoolInviteStatusDb>()
    .notNull()
    .default('pending'),
  addedAt: text('added_at')
    .notNull()
    .default(sql`now()`),
  respondedAt: text('responded_at'),
});

export const submissions = pgTable('submissions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  paperId: text('paper_id')
    .notNull()
    .references(() => papers.id),
  journalId: text('journal_id')
    .notNull()
    .references(() => journals.id),
  versionId: text('version_id').references(() => paperVersions.id),
  status: text('status')
    .notNull()
    .$type<SubmissionStatusDb>()
    .default('submitted'),
  reviewerWallets: jsonb('reviewer_wallets').$type<string[]>().default([]),
  reviewDeadline: text('review_deadline'),
  criteriaHash: text('criteria_hash'),
  criteriaTxId: text('criteria_tx_id'),
  criteriaMet: boolean('criteria_met'),
  decision: text('decision'),
  decisionJustification: text('decision_justification'),
  decisionTxId: text('decision_tx_id'),
  reviewDeadlineDays: integer('review_deadline_days').notNull().default(21),
  authorResponseStatus: text(
    'author_response_status',
  ).$type<AuthorResponseStatusDb>(),
  authorResponseAt: text('author_response_at'),
  authorResponseTxId: text('author_response_tx_id'),
  hederaTxId: text('hedera_tx_id'),
  hederaTimestamp: text('hedera_timestamp'),
  submittedAt: text('submitted_at')
    .notNull()
    .default(sql`now()`),
  decidedAt: text('decided_at'),
});

export const reviewCriteria = pgTable('review_criteria', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text('submission_id')
    .notNull()
    .references(() => submissions.id),
  criteriaJson: text('criteria_json').notNull(),
  criteriaHash: text('criteria_hash').notNull(),
  hederaTxId: text('hedera_tx_id'),
  publishedAt: text('published_at')
    .notNull()
    .default(sql`now()`),
});

export const reviewAssignments = pgTable('review_assignments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text('submission_id')
    .notNull()
    .references(() => submissions.id),
  reviewerWallet: text('reviewer_wallet').notNull(),
  status: text('status')
    .notNull()
    .$type<ReviewAssignmentStatusDb>()
    .default('assigned'),
  assignedAt: text('assigned_at')
    .notNull()
    .default(sql`now()`),
  deadline: text('deadline'),
  acceptedAt: text('accepted_at'),
  submittedAt: text('submitted_at'),
  timelineEnforcerIndex: integer('timeline_enforcer_index'),
});

export const reviews = pgTable('reviews', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text('submission_id')
    .notNull()
    .references(() => submissions.id),
  assignmentId: text('assignment_id')
    .notNull()
    .references(() => reviewAssignments.id),
  reviewerWallet: text('reviewer_wallet').notNull(),
  reviewHash: text('review_hash'),
  criteriaEvaluations: text('criteria_evaluations'),
  strengths: text('strengths'),
  weaknesses: text('weaknesses'),
  questionsForAuthors: text('questions_for_authors'),
  confidentialEditorComments: text('confidential_editor_comments'),
  recommendation: text('recommendation'),
  hederaTxId: text('hedera_tx_id'),
  submittedAt: text('submitted_at')
    .notNull()
    .default(sql`now()`),
});

export const reputationEvents = pgTable('reputation_events', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userWallet: text('user_wallet').notNull(),
  eventType: text('event_type').notNull().$type<ReputationEventTypeDb>(),
  scoreDelta: integer('score_delta').notNull().default(0),
  details: text('details'),
  htsTokenSerial: text('hts_token_serial'),
  hederaTxId: text('hedera_tx_id'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
});

export const reputationScores = pgTable('reputation_scores', {
  userWallet: text('user_wallet').primaryKey(),
  overallScore: integer('overall_score').notNull().default(0),
  timelinessScore: integer('timeliness_score').notNull().default(0),
  editorRatingAvg: integer('editor_rating_avg').notNull().default(0),
  authorRatingAvg: integer('author_rating_avg').notNull().default(0),
  publicationScore: integer('publication_score').notNull().default(0),
  reviewCount: integer('review_count').notNull().default(0),
  lastComputedAt: text('last_computed_at')
    .notNull()
    .default(sql`now()`),
});

export const rebuttals = pgTable('rebuttals', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text('submission_id')
    .notNull()
    .references(() => submissions.id),
  authorWallet: text('author_wallet').notNull(),
  status: text('status').notNull().$type<RebuttalStatusDb>().default('open'),
  deadline: text('deadline').notNull(),
  authorReason: text('author_reason'),
  rebuttalHash: text('rebuttal_hash'),
  hederaTxId: text('hedera_tx_id'),
  resolution: text('resolution').$type<RebuttalResolutionDb>(),
  editorNotes: text('editor_notes'),
  resolvedAt: text('resolved_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
});

export const rebuttalResponses = pgTable('rebuttal_responses', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  rebuttalId: text('rebuttal_id')
    .notNull()
    .references(() => rebuttals.id),
  reviewId: text('review_id')
    .notNull()
    .references(() => reviews.id),
  criterionId: text('criterion_id'),
  position: text('position').notNull().$type<RebuttalPositionDb>(),
  justification: text('justification').notNull(),
  evidence: text('evidence'),
});

export const reviewerRatings = pgTable('reviewer_ratings', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  reviewId: text('review_id')
    .notNull()
    .references(() => reviews.id)
    .unique(),
  // 5-protocol ratings (each 1-5)
  actionableFeedback: integer('actionable_feedback').notNull(),
  deepEngagement: integer('deep_engagement').notNull(),
  fairObjective: integer('fair_objective').notNull(),
  justifiedRecommendation: integer('justified_recommendation').notNull(),
  appropriateExpertise: integer('appropriate_expertise').notNull(),
  overallRating: integer('overall_rating').notNull(),
  // Anonymous comment (NO author reference — anonymity by design)
  comment: text('comment'),
  commentHash: text('comment_hash'),
  ratingHash: text('rating_hash'),
  reputationTokenSerial: text('reputation_token_serial'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
});

export const badges = pgTable('badges', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userWallet: text('user_wallet').notNull(),
  badgeType: text('badge_type').notNull().$type<BadgeTypeDb>(),
  achievementName: text('achievement_name').notNull(),
  reputationEventId: text('reputation_event_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  issuedAt: text('issued_at')
    .notNull()
    .default(sql`now()`),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
});

export const notifications = pgTable('notifications', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userWallet: text('user_wallet').notNull(),
  type: text('type').notNull().$type<NotificationTypeDb>(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  link: text('link'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
});

// ── Relations ──────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  papers: many(papers),
  contracts: many(authorshipContracts),
}));

export const papersRelations = relations(papers, ({ one, many }) => ({
  owner: one(users, { fields: [papers.ownerId], references: [users.id] }),
  versions: many(paperVersions),
  contracts: many(authorshipContracts),
  submissions: many(submissions),
}));

export const paperVersionsRelations = relations(paperVersions, ({ one }) => ({
  paper: one(papers, {
    fields: [paperVersions.paperId],
    references: [papers.id],
  }),
}));

export const authorshipContractsRelations = relations(
  authorshipContracts,
  ({ one, many }) => ({
    paper: one(papers, {
      fields: [authorshipContracts.paperId],
      references: [papers.id],
    }),
    creator: one(users, {
      fields: [authorshipContracts.creatorId],
      references: [users.id],
    }),
    contributors: many(contractContributors),
  }),
);

export const contractContributorsRelations = relations(
  contractContributors,
  ({ one }) => ({
    contract: one(authorshipContracts, {
      fields: [contractContributors.contractId],
      references: [authorshipContracts.id],
    }),
  }),
);

export const journalsRelations = relations(journals, ({ many }) => ({
  submissions: many(submissions),
  issues: many(journalIssues),
  reviewerPool: many(journalReviewers),
}));

export const journalIssuesRelations = relations(
  journalIssues,
  ({ one, many }) => ({
    journal: one(journals, {
      fields: [journalIssues.journalId],
      references: [journals.id],
    }),
    papers: many(issuePapers),
  }),
);

export const issuePapersRelations = relations(issuePapers, ({ one }) => ({
  issue: one(journalIssues, {
    fields: [issuePapers.issueId],
    references: [journalIssues.id],
  }),
  submission: one(submissions, {
    fields: [issuePapers.submissionId],
    references: [submissions.id],
  }),
}));

export const journalReviewersRelations = relations(
  journalReviewers,
  ({ one }) => ({
    journal: one(journals, {
      fields: [journalReviewers.journalId],
      references: [journals.id],
    }),
  }),
);

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  paper: one(papers, {
    fields: [submissions.paperId],
    references: [papers.id],
  }),
  journal: one(journals, {
    fields: [submissions.journalId],
    references: [journals.id],
  }),
  version: one(paperVersions, {
    fields: [submissions.versionId],
    references: [paperVersions.id],
  }),
  reviewCriteria: many(reviewCriteria),
  reviewAssignments: many(reviewAssignments),
  reviews: many(reviews),
  rebuttals: many(rebuttals),
}));

export const reviewCriteriaRelations = relations(reviewCriteria, ({ one }) => ({
  submission: one(submissions, {
    fields: [reviewCriteria.submissionId],
    references: [submissions.id],
  }),
}));

export const reviewAssignmentsRelations = relations(
  reviewAssignments,
  ({ one, many }) => ({
    submission: one(submissions, {
      fields: [reviewAssignments.submissionId],
      references: [submissions.id],
    }),
    reviews: many(reviews),
  }),
);

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  submission: one(submissions, {
    fields: [reviews.submissionId],
    references: [submissions.id],
  }),
  assignment: one(reviewAssignments, {
    fields: [reviews.assignmentId],
    references: [reviewAssignments.id],
  }),
  rating: one(reviewerRatings, {
    fields: [reviews.id],
    references: [reviewerRatings.reviewId],
  }),
  rebuttalResponses: many(rebuttalResponses),
}));

export const rebuttalsRelations = relations(rebuttals, ({ one, many }) => ({
  submission: one(submissions, {
    fields: [rebuttals.submissionId],
    references: [submissions.id],
  }),
  responses: many(rebuttalResponses),
}));

export const rebuttalResponsesRelations = relations(
  rebuttalResponses,
  ({ one }) => ({
    rebuttal: one(rebuttals, {
      fields: [rebuttalResponses.rebuttalId],
      references: [rebuttals.id],
    }),
    review: one(reviews, {
      fields: [rebuttalResponses.reviewId],
      references: [reviews.id],
    }),
  }),
);

export const reviewerRatingsRelations = relations(
  reviewerRatings,
  ({ one }) => ({
    review: one(reviews, {
      fields: [reviewerRatings.reviewId],
      references: [reviews.id],
    }),
  }),
);
