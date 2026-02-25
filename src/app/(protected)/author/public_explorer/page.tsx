import { Suspense } from "react";
import { PaperListServer } from "@/src/features/author/components/explorer/PaperListServer";
import { PaperDetailServer } from "@/src/features/author/components/explorer/PaperDetailServer";
import {
  ExplorerListSkeleton,
  PaperDetailSkeleton,
} from "@/src/features/author/components/skeletons";

interface PageProps {
  searchParams: Promise<{ paper?: string }>;
}

export default async function PaperExplorer({ searchParams }: PageProps) {
  const { paper: paperId } = await searchParams;

  if (paperId) {
    return (
      <Suspense fallback={<PaperDetailSkeleton />}>
        <PaperDetailServer paperId={paperId} />
      </Suspense>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto py-8 px-10">
      <div className="mb-7">
        <h1 className="text-[28px] font-normal text-[#e8e0d4] m-0">
          Explore Papers
        </h1>
        <p className="text-[13px] text-[#6a6050] mt-1.5 italic m-0">
          Discover verified research with on-chain provenance
        </p>
      </div>
      <Suspense fallback={<ExplorerListSkeleton />}>
        <PaperListServer />
      </Suspense>
    </div>
  );
}
