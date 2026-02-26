import type { SubmissionStage, StageFilter, StageColorConfig, ReviewCriterion } from "@/src/shared/types/editor-dashboard";

export const pipelineStages: SubmissionStage[] = [
  "New",
  "Criteria Published",
  "Reviewers Assigned",
  "Under Review",
  "Decision Pending",
  "Published",
  "Rejected",
];

export const stages: StageFilter[] = ["All", ...pipelineStages];

export const stageColors: Record<SubmissionStage, StageColorConfig> = {
  "New":                { bg: "rgba(150,150,170,0.15)", text: "#9a9aad", border: "rgba(150,150,170,0.3)" },
  "Criteria Published": { bg: "rgba(130,160,200,0.15)", text: "#7a9fc7", border: "rgba(130,160,200,0.3)" },
  "Reviewers Assigned": { bg: "rgba(160,140,200,0.15)", text: "#a98fc7", border: "rgba(160,140,200,0.3)" },
  "Under Review":       { bg: "rgba(180,180,120,0.15)", text: "#c9b458", border: "rgba(180,180,120,0.3)" },
  "Decision Pending":   { bg: "rgba(200,160,100,0.15)", text: "#c4956a", border: "rgba(200,160,100,0.3)" },
  "Published":          { bg: "rgba(120,180,120,0.15)", text: "#8fbc8f", border: "rgba(120,180,120,0.3)" },
  "Rejected":           { bg: "rgba(200,100,90,0.15)",  text: "#d4645a", border: "rgba(200,100,90,0.3)" },
};

export const reviewCriteria: ReviewCriterion[] = [
  { label: "Methodology is reproducible",        type: "Yes / No / Partially" },
  { label: "Statistical analysis is appropriate", type: "Yes / No / Partially" },
  { label: "Dataset is accessible and described", type: "Yes / No / Partially" },
  { label: "Claims are supported by evidence",    type: "Yes / No / Partially" },
  { label: "Related work is adequately cited",    type: "Yes / No / Partially" },
];
