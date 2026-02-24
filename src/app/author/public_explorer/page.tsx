import { Suspense } from "react";
import { listPublicPapers } from "@/src/features/papers";
import { mapApiPaperToExplorer } from "@/src/features/author/mappers/explorer";
import { ExplorerClient } from "@/src/features/author/components/explorer";
import { ExplorerListSkeleton } from "@/src/features/author/components/skeletons";
import type { ApiPublicPaper } from "@/src/shared/types/api";

async function ExplorerContent() {
  const raw = listPublicPapers() as unknown as ApiPublicPaper[];
  const papers = raw.map(mapApiPaperToExplorer);
  return <ExplorerClient initialPapers={papers} />;
}

export default function PaperExplorer() {
  return (
    <Suspense fallback={<ExplorerListSkeleton />}>
      <ExplorerContent />
    </Suspense>
  );
}
