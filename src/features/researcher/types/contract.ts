export type ContributorStatus = 'pending' | 'signed' | 'declined';

export interface Contributor {
  id: number;
  dbId?: string; // DB UUID — present once the contract has been persisted
  wallet: string;
  did: string;
  name: string;
  orcid: string;
  pct: number | '';
  role: string;
  status: ContributorStatus;
  txHash: string | null;
  signedAt: string | null;
  isCreator: boolean;
}

export interface ExistingDraft {
  id: number;
  dbId?: string; // DB UUID of the paper record
  title: string;
  hash: string;
  registered: boolean; // true if paper has been uploaded & hashed
  contractId?: string; // DB UUID of the matching authorship contract, if one exists
  contributors?: Contributor[]; // pre-mapped contributors for that contract
}

/** Lightweight contributor view for display-only components */
export interface ContractContributorView {
  name: string;
  role: string;
  pct: number;
  status: string;
  wallet?: string;
}

export interface KnownUser {
  did: string;
  name: string;
  orcid: string;
  wallet: string;
}
