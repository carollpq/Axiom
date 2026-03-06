import type { PaperUnderReview, ReviewCriterion } from "@/src/features/reviewer/types";
import type { DbReviewAssignment } from "@/src/features/reviews/queries";

const FALLBACK_PROVENANCE = [
  { label: "Paper Hash", hash: "—", verified: false },
];

const FALLBACK_CRITERIA: ReviewCriterion[] = [
  { id: 1, text: "Methodology is reproducible",        onChainHash: "0x3a1f8b2c9d4e5f60a7b8c9d0e1f2a3b4c5d6e7f8" },
  { id: 2, text: "Statistical analysis is appropriate", onChainHash: "0x4b2a9c3d0e5f6a71b8c9d0e1f2a3b4c5d6e7f8a9" },
  { id: 3, text: "Dataset is accessible and described", onChainHash: "0x5c3b0d4e1f6a7b82c9d0e1f2a3b4c5d6e7f8a9b0" },
  { id: 4, text: "Claims are supported by evidence",    onChainHash: "0x6d4c1e5f2a7b8c93d0e1f2a3b4c5d6e7f8a9b0c1" },
];

interface DbCriterion {
  id: string;
  label: string;
  evaluationType: string;
  description?: string;
  required: boolean;
}

export function mapAssignmentToPaper(assignment: NonNullable<DbReviewAssignment>): PaperUnderReview {
  const paper = assignment.submission.paper;
  const journal = assignment.submission.journal;
  const versions = paper.versions ?? [];
  const latestVersion = versions.length > 0 ? versions[versions.length - 1] : null;

  const provenance = latestVersion
    ? [
        { label: "Paper Hash", hash: latestVersion.paperHash, verified: true },
        ...(latestVersion.datasetHash
          ? [{ label: "Dataset", hash: latestVersion.datasetHash, verified: true }]
          : []),
        ...(latestVersion.codeRepoUrl
          ? [{ label: "Code Repository", hash: latestVersion.codeCommitHash ?? latestVersion.codeRepoUrl, url: latestVersion.codeRepoUrl, verified: !!latestVersion.codeCommitHash }]
          : []),
        ...(latestVersion.envSpecHash
          ? [{ label: "Environment Spec", hash: latestVersion.envSpecHash, verified: true }]
          : []),
      ]
    : FALLBACK_PROVENANCE;

  return {
    id: 0,
    title: paper.title,
    abstract: paper.abstract ?? "",
    journal: journal.name,
    version: latestVersion ? `v${latestVersion.versionNumber}` : "v1",
    anonymized: true,
    pdfUrl: "#",
    provenance,
  };
}

export function mapAssignmentToCriteria(assignment: NonNullable<DbReviewAssignment>): ReviewCriterion[] {
  const reviewCriteriaRow = assignment.submission.reviewCriteria?.[0];
  if (!reviewCriteriaRow?.criteriaJson) return FALLBACK_CRITERIA;

  try {
    const parsed = JSON.parse(reviewCriteriaRow.criteriaJson) as DbCriterion[];
    return parsed.map((c, idx) => ({
      id: idx + 1,
      text: c.label,
      onChainHash: reviewCriteriaRow.criteriaHash,
    }));
  } catch {
    return FALLBACK_CRITERIA;
  }
}
