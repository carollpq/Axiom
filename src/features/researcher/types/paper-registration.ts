export type Visibility = "private" | "public";

export interface SignedContract {
  id: number;
  title: string;
  hash: string;
  contributors: string;
  date: string;
}

export interface RegisteredJournal {
  id: string;
  name: string;
  reputationScore: string | null;
}

export interface ProvenanceItem {
  label: string;
  connected: boolean;
  icon: string;
}
