"use client";

// Backwards-compatible alias so existing hooks don't need updating all at once.
export { useUser as useCurrentUser } from "@/context/UserContext";
export type { DbUser } from "@/types/api";
