import { listUserPapers } from "@/src/features/papers/queries";
import { mapDbPaperToFrontend } from "@/src/features/researcher/mappers/dashboard";
import { PapersTable } from "./PapersTable";

interface Props {
  papersPromise: ReturnType<typeof listUserPapers>;
}

export async function PapersSection({ papersPromise }: Props) {
  const rawPapers = await papersPromise;
  const papers = rawPapers.map(mapDbPaperToFrontend);
  return <PapersTable initialPapers={papers} />;
}
