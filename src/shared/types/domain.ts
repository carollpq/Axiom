// Domain model types — canonical shapes shared across features.
// Import these in hooks, mappers, and pages instead of re-declaring local interfaces.

export interface PaperVersion {
  id: string;
  versionNumber: number;
  paperHash: string;
  datasetHash?: string | null;
  codeRepoUrl?: string | null;
  codeCommitHash?: string | null;
  envSpecHash?: string | null;
  fileStorageKey?: string | null;
  hederaTxId?: string | null;
  hederaTimestamp?: string | null;
  createdAt: string;
}

export interface ContractContributor {
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

export interface Contract {
  id: string;
  paperTitle: string;
  paperId: string | null;
  status: string;
  contractHash: string | null;
  hederaTxId: string | null;
  createdAt: string;
  contributors: ContractContributor[];
}

export interface Paper {
  id: string;
  title: string;
  status: string;
  abstract?: string | null;
  studyType?: string | null;
  litDataToEncryptHash?: string | null;
  litAccessConditionsJson?: string | null;
  createdAt: string;
  updatedAt: string;
  versions?: PaperVersion[];
  contracts?: {
    contractHash?: string | null;
    contributors?: ContractContributor[];
  }[];
  owner?: {
    displayName: string | null;
    walletAddress: string;
    orcidId: string | null;
    researchFields?: string[];
  } | null;
}

export interface User {
  id: string;
  walletAddress: string;
  did: string | null;
  displayName: string | null;
  institution: string | null;
  orcidId: string | null;
  roles: string[];
  researchFields: string[];
}

export type UserSearchResult = Pick<
  User,
  'id' | 'walletAddress' | 'displayName' | 'orcidId'
>;
