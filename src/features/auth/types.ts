export const ROLES = ["researcher", "editor", "reviewer"] as const;
export type Role = (typeof ROLES)[number];
