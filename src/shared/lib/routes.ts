/** Role → dashboard path. Single source of truth for post-login routing. */
export const ROLE_DASHBOARD_ROUTES: Record<string, string> = {
  researcher: "/researcher",
  editor: "/editor",
  reviewer: "/reviewer",
} as const;
