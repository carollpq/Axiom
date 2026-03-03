import { listPublicPapers } from "@/src/features/papers/queries";
import { mapApiPaperToExplorer } from "@/src/features/researcher/mappers/explorer";
import { ExplorerShell } from "./ExplorerShell.client";

export async function PaperListServer() {
  const raw = await listPublicPapers();
  const papers = raw.map(mapApiPaperToExplorer);
  return <ExplorerShell initialPapers={papers} />;
}
