import type { Visibility } from "@/src/features/researcher/types/paper-registration";
import type { StudyTypeDb } from "@/src/shared/lib/db/schema";

export const STEP_LABELS = ["Paper Details", "Provenance", "Contract", "Register / Submit"] as const;

export const STUDY_TYPE_VALUES = [
  "original", "negative_result", "replication", "replication_failed", "meta_analysis",
] as const satisfies readonly StudyTypeDb[];

export const PAPER_LIMITS = {
  title: { min: 3, max: 500 },
  abstract: { min: 20, max: 10_000 },
  keywords: { max: 20 },
} as const;

export const VISIBILITY_OPTIONS: { key: Visibility; label: string; desc: string }[] = [
  { key: "private", label: "Private Draft", desc: "Only hash recorded. Content not accessible to others." },
  { key: "public", label: "Public Draft", desc: "Content accessible via the platform." },
];

export const STUDY_TYPE_OPTIONS: { key: StudyTypeDb; label: string }[] = [
  { key: "original", label: "Original Research" },
  { key: "negative_result", label: "Negative Result" },
  { key: "replication", label: "Replication" },
  { key: "replication_failed", label: "Replication Failed" },
  { key: "meta_analysis", label: "Meta-Analysis" },
];
