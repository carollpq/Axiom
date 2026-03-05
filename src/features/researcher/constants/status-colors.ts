import type { SubmissionDisplayStatus } from "@/src/features/researcher/types/dashboard";

export const STATUS_COLORS: Record<SubmissionDisplayStatus, { bg: string; text: string; border: string }> = {
  "Paper Submitted": { bg: "rgba(90,122,154,0.2)", text: "#5a7a9a", border: "rgba(90,122,154,0.3)" },
  "Viewed By Editor": { bg: "rgba(201,164,74,0.15)", text: "#c9a44a", border: "rgba(201,164,74,0.3)" },
  "Desk Reject": { bg: "rgba(212,100,90,0.15)", text: "#d4645a", border: "rgba(212,100,90,0.3)" },
  "Assigned Reviewers": { bg: "rgba(143,188,143,0.15)", text: "#8fbc8f", border: "rgba(143,188,143,0.3)" },
  "Reviews In Progress": { bg: "rgba(201,164,74,0.15)", text: "#c9a44a", border: "rgba(201,164,74,0.3)" },
  "All Reviews Completed": { bg: "rgba(143,188,143,0.2)", text: "#8fbc8f", border: "rgba(143,188,143,0.3)" },
  "Rebuttal Phase": { bg: "rgba(212,100,90,0.15)", text: "#d4645a", border: "rgba(212,100,90,0.3)" },
  "Reviews Sent to Editor": { bg: "rgba(90,122,154,0.2)", text: "#5a7a9a", border: "rgba(90,122,154,0.3)" },
  "Accepted": { bg: "rgba(143,188,143,0.2)", text: "#8fbc8f", border: "rgba(143,188,143,0.3)" },
  "Rejected": { bg: "rgba(212,100,90,0.15)", text: "#d4645a", border: "rgba(212,100,90,0.3)" },
};
