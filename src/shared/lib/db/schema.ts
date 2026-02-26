import { pgTable, text, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export type PaperStatusDb =
  | "draft"
  | "registered"
  | "contract_pending"
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "published"
  | "retracted";

export type StudyTypeDb =
  | "original"
  | "meta_analysis"
  | "negative_result"
  | "replication"
  | "replication_failed";

export type VisibilityDb = "private" | "under_review" | "public";

export type ContractStatusDb =
  | "draft"
  | "pending_signatures"
  | "fully_signed"
  | "voided";

export type ContributorStatusDb = "pending" | "signed" | "declined";

export type SubmissionStatusDb =
  | "submitted"
  | "criteria_published"
  | "reviewers_assigned"
  | "under_review"
  | "rebuttal_open"
  | "revision_requested"
  | "accepted"
  | "rejected"
  | "published";

export type ReviewAssignmentStatusDb =
  | "assigned"
  | "accepted"
  | "declined"
  | "submitted"
  | "late";

export type ReputationEventTypeDb =
  | "review_completed"
  | "review_late"
  | "editor_rating"
  | "author_rating"
  | "paper_published"
  | "paper_retracted"
  | "rebuttal_upheld"
  | "rebuttal_overturned";

// ── Tables ─────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  walletAddress: text("wallet_address").notNull().unique(),
  did: text("did"),
  displayName: text("display_name"),
  institution: text("institution"),
  orcidId: text("orcid_id"),
  roles: jsonb("roles").notNull().$type<string[]>().default([]),
  researchFields: jsonb("research_fields").notNull().$type<string[]>().default([]),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const papers = pgTable("papers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  abstract: text("abstract"),
  status: text("status").notNull().$type<PaperStatusDb>().default("draft"),
  studyType: text("study_type")
    .notNull()
    .$type<StudyTypeDb>()
    .default("original"),
  visibility: text("visibility")
    .notNull()
    .$type<VisibilityDb>()
    .default("private"),
  currentVersion: integer("current_version").notNull().default(1),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  litDataToEncryptHash: text("lit_data_to_encrypt_hash"),
  litAccessConditionsJson: text("lit_access_conditions_json"),
  hederaTxId: text("hedera_tx_id"),
  hederaTimestamp: text("hedera_timestamp"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const paperVersions = pgTable("paper_versions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  paperId: text("paper_id")
    .notNull()
    .references(() => papers.id),
  versionNumber: integer("version_number").notNull(),
  paperHash: text("paper_hash").notNull(),
  datasetHash: text("dataset_hash"),
  codeRepoUrl: text("code_repo_url"),
  codeCommitHash: text("code_commit_hash"),
  envSpecHash: text("env_spec_hash"),
  fileStorageKey: text("file_storage_key"),
  hederaTxId: text("hedera_tx_id"),
  hederaTimestamp: text("hedera_timestamp"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});

export const authorshipContracts = pgTable("authorship_contracts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  paperId: text("paper_id").references(() => papers.id),
  paperTitle: text("paper_title").notNull(),
  contractHash: text("contract_hash"),
  status: text("status")
    .notNull()
    .$type<ContractStatusDb>()
    .default("draft"),
  version: integer("version").notNull().default(1),
  creatorId: text("creator_id")
    .notNull()
    .references(() => users.id),
  hederaTxId: text("hedera_tx_id"),
  hederaTimestamp: text("hedera_timestamp"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const contractContributors = pgTable("contract_contributors", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  contractId: text("contract_id")
    .notNull()
    .references(() => authorshipContracts.id),
  contributorWallet: text("contributor_wallet").notNull(),
  contributorName: text("contributor_name"),
  contributionPct: integer("contribution_pct").notNull(),
  roleDescription: text("role_description"),
  signature: text("signature"),
  status: text("status")
    .notNull()
    .$type<ContributorStatusDb>()
    .default("pending"),
  isCreator: boolean("is_creator").notNull().default(false),
  signedAt: text("signed_at"),
  inviteToken: text("invite_token").unique(),
  inviteExpiresAt: text("invite_expires_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});

export const journals = pgTable("journals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  editorWallet: text("editor_wallet").notNull(),
  reputationScore: text("reputation_score").default("4.3"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const submissions = pgTable("submissions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  paperId: text("paper_id")
    .notNull()
    .references(() => papers.id),
  journalId: text("journal_id")
    .notNull()
    .references(() => journals.id),
  versionId: text("version_id").references(() => paperVersions.id),
  status: text("status")
    .notNull()
    .$type<SubmissionStatusDb>()
    .default("submitted"),
  reviewerWallets: jsonb("reviewer_wallets").$type<string[]>().default([]),
  reviewDeadline: text("review_deadline"),
  criteriaHash: text("criteria_hash"),
  criteriaTxId: text("criteria_tx_id"),
  criteriaMet: boolean("criteria_met"),
  decision: text("decision"),
  decisionJustification: text("decision_justification"),
  decisionTxId: text("decision_tx_id"),
  reviewDeadlineDays: integer("review_deadline_days").notNull().default(21),
  hederaTxId: text("hedera_tx_id"),
  hederaTimestamp: text("hedera_timestamp"),
  submittedAt: text("submitted_at")
    .notNull()
    .default(sql`now()`),
  decidedAt: text("decided_at"),
});

export const reviewCriteria = pgTable("review_criteria", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .references(() => submissions.id),
  criteriaJson: text("criteria_json").notNull(),
  criteriaHash: text("criteria_hash").notNull(),
  hederaTxId: text("hedera_tx_id"),
  publishedAt: text("published_at")
    .notNull()
    .default(sql`now()`),
});

export const reviewAssignments = pgTable("review_assignments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .references(() => submissions.id),
  reviewerWallet: text("reviewer_wallet").notNull(),
  status: text("status")
    .notNull()
    .$type<ReviewAssignmentStatusDb>()
    .default("assigned"),
  assignedAt: text("assigned_at")
    .notNull()
    .default(sql`now()`),
  deadline: text("deadline"),
  acceptedAt: text("accepted_at"),
  submittedAt: text("submitted_at"),
});

export const reviews = pgTable("reviews", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .references(() => submissions.id),
  assignmentId: text("assignment_id")
    .notNull()
    .references(() => reviewAssignments.id),
  reviewerWallet: text("reviewer_wallet").notNull(),
  reviewHash: text("review_hash"),
  criteriaEvaluations: text("criteria_evaluations"),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  questionsForAuthors: text("questions_for_authors"),
  confidentialEditorComments: text("confidential_editor_comments"),
  recommendation: text("recommendation"),
  hederaTxId: text("hedera_tx_id"),
  submittedAt: text("submitted_at")
    .notNull()
    .default(sql`now()`),
});

export const reputationEvents = pgTable("reputation_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userWallet: text("user_wallet").notNull(),
  eventType: text("event_type")
    .notNull()
    .$type<ReputationEventTypeDb>(),
  scoreDelta: integer("score_delta").notNull().default(0),
  details: text("details"),
  htsTokenSerial: text("hts_token_serial"),
  hederaTxId: text("hedera_tx_id"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});

export const reputationScores = pgTable("reputation_scores", {
  userWallet: text("user_wallet").primaryKey(),
  overallScore: integer("overall_score").notNull().default(0),
  timelinessScore: integer("timeliness_score").notNull().default(0),
  editorRatingAvg: integer("editor_rating_avg").notNull().default(0),
  authorRatingAvg: integer("author_rating_avg").notNull().default(0),
  publicationScore: integer("publication_score").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  lastComputedAt: text("last_computed_at")
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
}));

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
}));

export const reviewCriteriaRelations = relations(reviewCriteria, ({ one }) => ({
  submission: one(submissions, {
    fields: [reviewCriteria.submissionId],
    references: [submissions.id],
  }),
}));

export const reviewAssignmentsRelations = relations(reviewAssignments, ({ one, many }) => ({
  submission: one(submissions, {
    fields: [reviewAssignments.submissionId],
    references: [submissions.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  submission: one(submissions, {
    fields: [reviews.submissionId],
    references: [submissions.id],
  }),
  assignment: one(reviewAssignments, {
    fields: [reviews.assignmentId],
    references: [reviewAssignments.id],
  }),
}));
