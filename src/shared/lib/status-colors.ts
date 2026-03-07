import type { BadgeColorConfig } from "@/src/shared/types/shared";

export const statusColors: Record<string, BadgeColorConfig> = {
  // --- Shared / paper-level ---
  Published: { bg: "rgba(120,180,120,0.15)", text: "#8fbc8f", border: "rgba(120,180,120,0.3)" },
  "Under Review": { bg: "rgba(180,180,120,0.15)", text: "#c9b458", border: "rgba(180,180,120,0.3)" },
  "Contract Pending": { bg: "rgba(180,140,100,0.15)", text: "#c4956a", border: "rgba(180,140,100,0.3)" },
  "Revision Requested": { bg: "rgba(200,130,100,0.15)", text: "#d4845a", border: "rgba(200,130,100,0.3)" },
  Draft: { bg: "rgba(150,150,170,0.15)", text: "#9a9aad", border: "rgba(150,150,170,0.3)" },
  Submitted: { bg: "rgba(130,160,200,0.15)", text: "#7a9fc7", border: "rgba(130,160,200,0.3)" },
  Registered: { bg: "rgba(130,160,200,0.15)", text: "#7a9fc7", border: "rgba(130,160,200,0.3)" },
  Retracted: { bg: "rgba(200,100,90,0.15)", text: "#d4645a", border: "rgba(200,100,90,0.3)" },

  // --- Reviewer statuses ---
  Late: { bg: "rgba(200,100,90,0.15)", text: "#d4645a", border: "rgba(200,100,90,0.3)" },
  "In Progress": { bg: "rgba(130,160,200,0.15)", text: "#7a9fc7", border: "rgba(130,160,200,0.3)" },
  Pending: { bg: "rgba(150,150,170,0.15)", text: "#9a9aad", border: "rgba(150,150,170,0.3)" },

  // --- Editor stages ---
  New: { bg: "rgba(150,150,170,0.15)", text: "#9a9aad", border: "rgba(150,150,170,0.3)" },
  "Criteria Published": { bg: "rgba(130,160,200,0.15)", text: "#7a9fc7", border: "rgba(130,160,200,0.3)" },
  "Reviewers Assigned": { bg: "rgba(160,140,200,0.15)", text: "#a98fc7", border: "rgba(160,140,200,0.3)" },
  "Decision Pending": { bg: "rgba(200,160,100,0.15)", text: "#c4956a", border: "rgba(200,160,100,0.3)" },
  Rejected: { bg: "rgba(200,100,90,0.15)", text: "#d4645a", border: "rgba(200,100,90,0.3)" },

  // --- Researcher statuses ---
  "Paper Submitted": { bg: "rgba(90,122,154,0.2)", text: "#5a7a9a", border: "rgba(90,122,154,0.3)" },
  "Viewed By Editor": { bg: "rgba(201,164,74,0.15)", text: "#c9a44a", border: "rgba(201,164,74,0.3)" },
  "Desk Reject": { bg: "rgba(212,100,90,0.15)", text: "#d4645a", border: "rgba(212,100,90,0.3)" },
  "All Reviews Completed": { bg: "rgba(143,188,143,0.2)", text: "#8fbc8f", border: "rgba(143,188,143,0.3)" },
  "Rebuttal Phase": { bg: "rgba(212,100,90,0.15)", text: "#d4645a", border: "rgba(212,100,90,0.3)" },
  "Reviews Sent to Editor": { bg: "rgba(90,122,154,0.2)", text: "#5a7a9a", border: "rgba(90,122,154,0.3)" },
  Accepted: { bg: "rgba(143,188,143,0.2)", text: "#8fbc8f", border: "rgba(143,188,143,0.3)" },
};

const GREEN: BadgeColorConfig = { bg: "rgba(143,188,143,0.15)", text: "#8fbc8f", border: "rgba(143,188,143,0.3)" };
const GOLD: BadgeColorConfig = { bg: "rgba(201,164,74,0.15)", text: "#c9a44a", border: "rgba(201,164,74,0.3)" };
const DEFAULT: BadgeColorConfig = { bg: "rgba(90,122,154,0.2)", text: "#5a7a9a", border: "rgba(90,122,154,0.3)" };

export function getStatusColors(status: string): BadgeColorConfig {
  if (statusColors[status]) return statusColors[status];
  // Researcher dynamic fallbacks
  if (status.startsWith("Assigned")) return GREEN;
  if (status.includes("Reviews Completed") && !status.startsWith("All")) return GOLD;
  return DEFAULT;
}
