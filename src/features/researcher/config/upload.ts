import type { StudyTypeDb } from "@/src/shared/lib/db/schema";

export const STUDY_TYPE_VALUES = [
  "original", "negative_result", "replication", "replication_failed", "meta_analysis",
] as const satisfies readonly StudyTypeDb[];

export const PAPER_LIMITS = {
  title: { min: 3, max: 500 },
  abstract: { min: 20, max: 10_000 },
  keywords: { max: 20 },
} as const;

export const STUDY_TYPE_OPTIONS: { key: StudyTypeDb; label: string }[] = [
  { key: "original", label: "Original Research" },
  { key: "negative_result", label: "Negative Result" },
  { key: "replication", label: "Replication" },
  { key: "replication_failed", label: "Replication Failed" },
  { key: "meta_analysis", label: "Meta-Analysis" },
];
