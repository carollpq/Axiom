import type {
  PaperUnderReview,
  ReviewCriterion,
} from '@/src/features/reviewer/types/workspace';

/** Common shape accepted by workspace mappers — both DbReviewAssignment and DbAssignedReview satisfy this. */
export interface ReviewAssignmentLike {
  id: string;
  submission: {
    paper: {
      id: string;
      title: string;
      abstract: string | null;
      versions: Array<{
        versionNumber: number;
        paperHash: string;
        datasetHash: string | null;
        codeRepoUrl: string | null;
        codeCommitHash: string | null;
        envSpecHash: string | null;
        fileStorageKey: string | null;
      }>;
    };
    journal: { name: string } | null;
    reviewCriteria?: Array<{
      criteriaJson: string | null;
      criteriaHash: string;
    }>;
  };
}

const FALLBACK_PROVENANCE = [
  { label: 'Paper Hash', hash: '—', verified: false },
];

const FALLBACK_CRITERIA: ReviewCriterion[] = [
  {
    id: 1,
    text: 'Methodology is reproducible',
    onChainHash: 'unpublished',
  },
  {
    id: 2,
    text: 'Statistical analysis is appropriate',
    onChainHash: 'unpublished',
  },
  {
    id: 3,
    text: 'Dataset is accessible and described',
    onChainHash: 'unpublished',
  },
  {
    id: 4,
    text: 'Claims are supported by evidence',
    onChainHash: 'unpublished',
  },
];

interface DbCriterion {
  id: string;
  label: string;
  evaluationType: string;
  description?: string;
  required: boolean;
}

/** Builds paper view model from assignment. Extracts provenance from latest version. */
export function mapAssignmentToPaper(
  assignment: ReviewAssignmentLike,
): PaperUnderReview {
  const paper = assignment.submission.paper;
  const journal = assignment.submission.journal;
  const versions = paper.versions ?? [];
  const latestVersion =
    versions.length > 0 ? versions[versions.length - 1] : null;

  const provenance = latestVersion
    ? [
        { label: 'Paper Hash', hash: latestVersion.paperHash, verified: true },
        ...(latestVersion.datasetHash
          ? [
              {
                label: 'Dataset',
                hash: latestVersion.datasetHash,
                verified: true,
              },
            ]
          : []),
        ...(latestVersion.codeRepoUrl
          ? [
              {
                label: 'Code Repository',
                hash: latestVersion.codeCommitHash ?? latestVersion.codeRepoUrl,
                url: latestVersion.codeRepoUrl,
                verified: !!latestVersion.codeCommitHash,
              },
            ]
          : []),
        ...(latestVersion.envSpecHash
          ? [
              {
                label: 'Environment Spec',
                hash: latestVersion.envSpecHash,
                verified: true,
              },
            ]
          : []),
      ]
    : FALLBACK_PROVENANCE;

  return {
    id: 0,
    title: paper.title,
    abstract: paper.abstract ?? '',
    journal: journal?.name ?? '—',
    version: latestVersion ? `v${latestVersion.versionNumber}` : 'v1',
    anonymized: true,
    pdfUrl: latestVersion?.fileStorageKey
      ? `/api/papers/${paper.id}/content?format=raw`
      : '#',
    provenance,
  };
}

/** Parses published criteria JSON into display items. Falls back to hardcoded defaults. */
export function mapAssignmentToCriteria(
  assignment: ReviewAssignmentLike,
): ReviewCriterion[] {
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
