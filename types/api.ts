// Shared API response types — match what route handlers actually return.
// Import these in hooks instead of re-declaring local interfaces.

export interface ApiPaperVersion {
  paperHash: string;
  datasetHash?: string | null;
  codeRepoUrl?: string | null;
  codeCommitHash?: string | null;
  envSpecHash?: string | null;
}

export interface ApiContractContributor {
  id: string;
  contributorWallet: string;
  contributorName: string | null;
  contributionPct: number;
  roleDescription: string | null;
  status: string;
  signature: string | null;
  signedAt: string | null;
  isCreator: boolean;
}

export interface ApiContract {
  id: string;
  paperTitle: string;
  paperId: string | null;
  status: string;
  contractHash: string | null;
  createdAt: string;
  contributors: ApiContractContributor[];
}

export interface ApiPaper {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  versions?: ApiPaperVersion[];
  contracts?: { contributors?: ApiContractContributor[] }[];
}

export interface DbUser {
  id: string;
  walletAddress: string;
  did: string | null;
  displayName: string | null;
  institution: string | null;
  orcidId: string | null;
  roles: string[];
  researchFields: string[];
}
