CREATE TABLE "authorship_contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"paper_id" text,
	"paper_title" text NOT NULL,
	"contract_hash" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"creator_id" text NOT NULL,
	"hedera_tx_id" text,
	"hedera_timestamp" text,
	"hedera_schedule_id" text,
	"hedera_schedule_tx_id" text,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" text PRIMARY KEY NOT NULL,
	"user_wallet" text NOT NULL,
	"badge_type" text NOT NULL,
	"achievement_name" text NOT NULL,
	"reputation_event_id" text,
	"metadata" jsonb,
	"issued_at" text DEFAULT now() NOT NULL,
	"created_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_contributors" (
	"id" text PRIMARY KEY NOT NULL,
	"contract_id" text NOT NULL,
	"contributor_wallet" text NOT NULL,
	"contributor_name" text,
	"contribution_pct" integer NOT NULL,
	"role_description" text,
	"signature" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_creator" boolean DEFAULT false NOT NULL,
	"signed_at" text,
	"hedera_schedule_sign_tx_id" text,
	"invite_token" text,
	"invite_expires_at" text,
	"created_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "contract_contributors_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "issue_papers" (
	"id" text PRIMARY KEY NOT NULL,
	"issue_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"added_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_issues" (
	"id" text PRIMARY KEY NOT NULL,
	"journal_id" text NOT NULL,
	"label" text NOT NULL,
	"created_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_reviewers" (
	"id" text PRIMARY KEY NOT NULL,
	"journal_id" text NOT NULL,
	"reviewer_wallet" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"added_at" text DEFAULT now() NOT NULL,
	"responded_at" text
);
--> statement-breakpoint
CREATE TABLE "journals" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"editor_wallet" text NOT NULL,
	"reputation_score" text DEFAULT '4.3',
	"aims_and_scope" text,
	"submission_criteria" text,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_wallet" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paper_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"paper_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"paper_hash" text NOT NULL,
	"dataset_hash" text,
	"code_repo_url" text,
	"code_commit_hash" text,
	"env_spec_hash" text,
	"file_storage_key" text,
	"hedera_tx_id" text,
	"hedera_timestamp" text,
	"created_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "papers" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"abstract" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"study_type" text DEFAULT 'original' NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"owner_id" text NOT NULL,
	"lit_data_to_encrypt_hash" text,
	"lit_access_conditions_json" text,
	"hedera_tx_id" text,
	"hedera_timestamp" text,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rebuttal_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"rebuttal_id" text NOT NULL,
	"review_id" text NOT NULL,
	"criterion_id" text,
	"position" text NOT NULL,
	"justification" text NOT NULL,
	"evidence" text
);
--> statement-breakpoint
CREATE TABLE "rebuttals" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"author_wallet" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"deadline" text NOT NULL,
	"rebuttal_hash" text,
	"hedera_tx_id" text,
	"resolution" text,
	"editor_notes" text,
	"resolved_at" text,
	"created_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reputation_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_wallet" text NOT NULL,
	"event_type" text NOT NULL,
	"score_delta" integer DEFAULT 0 NOT NULL,
	"details" text,
	"hts_token_serial" text,
	"hedera_tx_id" text,
	"created_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reputation_scores" (
	"user_wallet" text PRIMARY KEY NOT NULL,
	"overall_score" integer DEFAULT 0 NOT NULL,
	"timeliness_score" integer DEFAULT 0 NOT NULL,
	"editor_rating_avg" integer DEFAULT 0 NOT NULL,
	"author_rating_avg" integer DEFAULT 0 NOT NULL,
	"publication_score" integer DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"last_computed_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"reviewer_wallet" text NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"assigned_at" text DEFAULT now() NOT NULL,
	"deadline" text,
	"accepted_at" text,
	"submitted_at" text,
	"timeline_enforcer_index" integer
);
--> statement-breakpoint
CREATE TABLE "review_criteria" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"criteria_json" text NOT NULL,
	"criteria_hash" text NOT NULL,
	"hedera_tx_id" text,
	"published_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviewer_ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"review_id" text NOT NULL,
	"actionable_feedback" integer NOT NULL,
	"deep_engagement" integer NOT NULL,
	"fair_objective" integer NOT NULL,
	"justified_recommendation" integer NOT NULL,
	"appropriate_expertise" integer NOT NULL,
	"overall_rating" integer NOT NULL,
	"comment" text,
	"comment_hash" text,
	"rating_hash" text,
	"reputation_token_serial" text,
	"created_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "reviewer_ratings_review_id_unique" UNIQUE("review_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"reviewer_wallet" text NOT NULL,
	"review_hash" text,
	"criteria_evaluations" text,
	"strengths" text,
	"weaknesses" text,
	"questions_for_authors" text,
	"confidential_editor_comments" text,
	"recommendation" text,
	"hedera_tx_id" text,
	"submitted_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"paper_id" text NOT NULL,
	"journal_id" text NOT NULL,
	"version_id" text,
	"status" text DEFAULT 'submitted' NOT NULL,
	"reviewer_wallets" jsonb DEFAULT '[]'::jsonb,
	"review_deadline" text,
	"criteria_hash" text,
	"criteria_tx_id" text,
	"criteria_met" boolean,
	"decision" text,
	"decision_justification" text,
	"decision_tx_id" text,
	"review_deadline_days" integer DEFAULT 21 NOT NULL,
	"author_response_status" text,
	"author_response_at" text,
	"author_response_tx_id" text,
	"hedera_tx_id" text,
	"hedera_timestamp" text,
	"submitted_at" text DEFAULT now() NOT NULL,
	"decided_at" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"did" text,
	"display_name" text,
	"institution" text,
	"orcid_id" text,
	"roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"research_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
ALTER TABLE "authorship_contracts" ADD CONSTRAINT "authorship_contracts_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authorship_contracts" ADD CONSTRAINT "authorship_contracts_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_contributors" ADD CONSTRAINT "contract_contributors_contract_id_authorship_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."authorship_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_papers" ADD CONSTRAINT "issue_papers_issue_id_journal_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."journal_issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_papers" ADD CONSTRAINT "issue_papers_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_issues" ADD CONSTRAINT "journal_issues_journal_id_journals_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_reviewers" ADD CONSTRAINT "journal_reviewers_journal_id_journals_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_versions" ADD CONSTRAINT "paper_versions_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rebuttal_responses" ADD CONSTRAINT "rebuttal_responses_rebuttal_id_rebuttals_id_fk" FOREIGN KEY ("rebuttal_id") REFERENCES "public"."rebuttals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rebuttal_responses" ADD CONSTRAINT "rebuttal_responses_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rebuttals" ADD CONSTRAINT "rebuttals_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_assignments" ADD CONSTRAINT "review_assignments_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_criteria" ADD CONSTRAINT "review_criteria_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviewer_ratings" ADD CONSTRAINT "reviewer_ratings_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_assignment_id_review_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."review_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_journal_id_journals_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_version_id_paper_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."paper_versions"("id") ON DELETE no action ON UPDATE no action;