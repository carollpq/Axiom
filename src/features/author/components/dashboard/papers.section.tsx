import { listUserPapers } from "@/features/papers/queries";
import { mapDbPaperToFrontend } from "@/features/author/mappers/dashboard";
import { PapersTableClient } from "./papers-table.client";
import type { ApiPaper } from "@/src/shared/types/api";

interface Props {
  papersPromise: ReturnType<typeof listUserPapers>;
}

export async function PapersSection({ papersPromise }: Props) {
  const rawPapers = await papersPromise;
  const papers = (rawPapers as unknown as ApiPaper[]).map(mapDbPaperToFrontend);
  return <PapersTableClient initialPapers={papers} />;
}
