import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// SQLite doesn't have native enums — we use text columns with TypeScript types.
// These types mirror the planned PostgreSQL enums for future migration.

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
  | "under_review"
  | "revision_requested"
  | "accepted"
  | "rejected"
  | "published";

// ── Tables ─────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  walletAddress: text("wallet_address").notNull().unique(),
  did: text("did"),
  displayName: text("display_name"),
  institution: text("institution"),
  orcidId: text("orcid_id"),
  roles: text("roles", { mode: "json" }).notNull().$type<string[]>().default([]),
  researchFields: text("research_fields", { mode: "json" })
    .notNull()
    .$type<string[]>()
    .default([]),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const papers = sqliteTable("papers", {
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
  accessPrice: text("access_price"),
  litDataToEncryptHash: text("lit_data_to_encrypt_hash"),
  litAccessConditionsJson: text("lit_access_conditions_json"),
  hederaTxId: text("hedera_tx_id"),
  hederaTimestamp: text("hedera_timestamp"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const paperVersions = sqliteTable("paper_versions", {
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
    .default(sql`(datetime('now'))`),
});

export const authorshipContracts = sqliteTable("authorship_contracts", {
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
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const contractContributors = sqliteTable("contract_contributors", {
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
  isCreator: integer("is_creator", { mode: "boolean" }).notNull().default(false),
  signedAt: text("signed_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const journals = sqliteTable("journals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  editorWallet: text("editor_wallet").notNull(),
  reputationScore: text("reputation_score").default("4.3"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const submissions = sqliteTable("submissions", {
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
  // Reviewer wallets assigned to this submission
  reviewerWallets: text("reviewer_wallets", { mode: "json" })
    .$type<string[]>()
    .default([]),
  reviewDeadline: text("review_deadline"),
  // On-chain anchoring for criteria
  criteriaHash: text("criteria_hash"),
  criteriaTxId: text("criteria_tx_id"),
  criteriaMet: integer("criteria_met", { mode: "boolean" }),
  // Decision
  decision: text("decision"),
  decisionJustification: text("decision_justification"),
  decisionTxId: text("decision_tx_id"),
  // Hedera anchoring for submission event
  hederaTxId: text("hedera_tx_id"),
  hederaTimestamp: text("hedera_timestamp"),
  submittedAt: text("submitted_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  decidedAt: text("decided_at"),
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

export const submissionsRelations = relations(submissions, ({ one }) => ({
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
}));
