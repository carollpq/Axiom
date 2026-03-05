import type { ApiPaper, ApiPaperVersion } from "@/src/shared/types/api";

export type PaperVersion = Pick<
  ApiPaperVersion,
  "id" | "versionNumber" | "paperHash" | "fileStorageKey" | "createdAt"
>;

export type PaperWithVersions = Pick<ApiPaper, "id" | "title"> & {
  versions: PaperVersion[];
};
