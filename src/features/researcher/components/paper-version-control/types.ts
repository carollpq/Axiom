export interface PaperVersion {
  id: string;
  versionNumber: number;
  paperHash: string;
  fileStorageKey: string | null;
  createdAt: string;
}

export interface PaperWithVersions {
  id: string;
  title: string;
  versions: PaperVersion[];
}
