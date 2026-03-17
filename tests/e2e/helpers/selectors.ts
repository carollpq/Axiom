/**
 * Centralized selectors for E2E tests.
 * Uses data-testid where added, semantic selectors (roles, text) otherwise.
 */

// ── data-testid selectors ─────────────────────────────────────────────────

export const tid = (id: string) => `[data-testid="${id}"]`;

// Researcher - Create Submission
export const CREATE_SUBMISSION_FORM = tid('create-submission-form');
export const PAPER_SELECT = tid('paper-select');
export const VERSION_SELECT = tid('version-select');
export const JOURNAL_SELECT = tid('journal-select');
export const CONTRACT_SELECT = tid('contract-select');
export const SUBMIT_PAPER_BTN = tid('submit-paper-btn');

// Editor - Criteria Builder
export const CRITERIA_BUILDER = tid('criteria-builder');
export const ADD_CRITERION_BTN = tid('add-criterion-btn');
export const CRITERION_ROW = tid('criterion-row');
export const PUBLISH_CRITERIA_BTN = tid('publish-criteria-btn');

// Editor - Assign Reviewers
export const ASSIGN_REVIEWERS_PANEL = tid('assign-reviewers-panel');
export const REVIEWER_SEARCH = tid('reviewer-search');
export const SEND_INVITES_BTN = tid('send-invites-btn');

// Editor - Decision Panel
export const DECISION_PANEL = tid('decision-panel');
export const DECISION_SELECT = tid('decision-select');
export const DECISION_COMMENT = tid('decision-comment');
export const RELEASE_DECISION_BTN = tid('release-decision-btn');

// Reviewer - Review Workspace
export const REVIEW_WORKSPACE = tid('review-workspace');
export const CRITERION_EVAL = tid('criterion-eval');
export const STRENGTHS_INPUT = tid('strengths-input');
export const WEAKNESSES_INPUT = tid('weaknesses-input');
export const QUESTIONS_INPUT = tid('questions-input');
export const CONFIDENTIAL_COMMENTS_INPUT = tid('confidential-comments-input');
export const RECOMMENDATION_SELECT = tid('recommendation-select');
export const SUBMIT_REVIEW_BTN = tid('submit-review-btn');
export const SAVE_DRAFT_BTN = tid('save-draft-btn');
export const DRAFT_SAVED_INDICATOR = tid('draft-saved-indicator');
export const UNSAVED_CHANGES_INDICATOR = tid('unsaved-changes-indicator');

// Reviewer - Invites
export const ACCEPT_ASSIGNMENT_BTN = tid('accept-assignment-btn');
export const DECLINE_ASSIGNMENT_BTN = tid('decline-assignment-btn');

// Reviewer - Pool Invites
export const POOL_INVITE_ACCEPT = tid('pool-invite-accept');
export const POOL_INVITE_REJECT = tid('pool-invite-reject');

// Reviewer - Dashboard
export const BADGE_CARD = tid('badge-card');

// Rebuttal - Response Form
export const REBUTTAL_RESPONSE_FORM = tid('rebuttal-response-form');
export const REBUTTAL_SUBMIT_BTN = tid('rebuttal-submit-btn');
export const AGREE_BTN = tid('agree-btn');
export const DISAGREE_BTN = tid('disagree-btn');
export const JUSTIFICATION_INPUT = tid('justification-input');

// Researcher - Review Response
export const REVIEW_RESPONSE_CARD = tid('review-response-card');
export const ACCEPT_REVIEWS_BTN = tid('accept-reviews-btn');
export const REQUEST_REBUTTAL_BTN = tid('request-rebuttal-btn');

// Shared
export const PAPER_CARD = tid('paper-card');

// ── Semantic selectors ────────────────────────────────────────────────────

export const HEADING = (text: string) => `h1:has-text("${text}"), h2:has-text("${text}"), h3:has-text("${text}")`;
export const BUTTON = (text: string) => `button:has-text("${text}")`;
export const LINK = (text: string) => `a:has-text("${text}")`;
