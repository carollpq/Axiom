export type DetailTab = "overview" | "provenance" | "versions" | "reviews";

export type SortOption = "newest" | "oldest";

export interface PaperAuthor {
  name: string;
  pct: number;
  orcid: string;
  role: string;
}

export interface PaperVersion {
  v: string;
  date: string;
  label: string;
  hash: string;
  note?: string;
}

export interface ReviewCriteria {
  label: string;
  met: string;
}

export interface PaperReview {
  reviewer: string;
  rec: string;
  criteria: ReviewCriteria[];
  strengths: string;
  weaknesses: string;
}

export interface ExplorerPaper {
  id: string;
  title: string;
  authors: PaperAuthor[];
  status: string;
  studyType: string;
  journal: string;
  field: string;
  date: string;
  abstract: string;
  paperHash: string;
  datasetHash: string;
  codeCommit: string;
  envHash: string;
  contractHash: string;
  txHash: string;
  regTimestamp: string;
  codeUrl: string;
  datasetUrl: string;
  visibility: string;
  litDataToEncryptHash: string | null;
  litAccessConditionsJson: string | null;
  fileStorageKey: string | null;
  versions: PaperVersion[];
  reviews: PaperReview[];
  decision: string | null;
  retracted: boolean;
  retractionReason?: string;
  retractionParty?: string;
  retractionComponent?: string;
}

export type { BadgeColorConfig as StatusColor } from "@/src/shared/types/shared";
