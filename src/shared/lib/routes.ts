/* ──────────────────────────────────────────────────────────────────────────
 * Central route constants — single source of truth for every path string.
 * Nav items stay co-located in each feature's nav.ts but reference these.
 * ────────────────────────────────────────────────────────────────────────── */

export const ROUTES = {
  login: '/login',
  register: '/register',

  researcher: {
    root: '/researcher',
    contracts: '/researcher/authorship-contracts',
    paperVersions: '/researcher/paper-version-control',
    createSubmission: '/researcher/create-submission',
    viewSubmissions: '/researcher/view-submissions',
    /** Dynamic — call with submissionId */
    rebuttal: (submissionId: string) =>
      `/researcher/rebuttal/${submissionId}` as const,
    /** Dynamic — call with submissionId */
    reviewResponse: (submissionId: string) =>
      `/researcher/review-response/${submissionId}` as const,
  },

  editor: {
    root: '/editor',
    incoming: '/editor/incoming',
    underReview: '/editor/under-review',
    accepted: '/editor/accepted',
    management: '/editor/management',
  },

  reviewer: {
    root: '/reviewer',
    poolInvites: '/reviewer/pool-invites',
    invites: '/reviewer/invites',
    assigned: '/reviewer/assigned',
    completed: '/reviewer/completed',
  },
} as const;

/** Role → dashboard path. Used for post-login routing & role-guard fallbacks. */
export const ROLE_DASHBOARD_ROUTES: Record<
  'researcher' | 'editor' | 'reviewer',
  string
> = {
  researcher: ROUTES.researcher.root,
  editor: ROUTES.editor.root,
  reviewer: ROUTES.reviewer.root,
};
