import Link from "next/link";
import { getPaperById } from "@/src/features/papers/queries";
import { mapApiPaperToExplorer } from "@/src/features/author/mappers/explorer";
import { RetractionBanner } from "./RetractionBanner";
import { DetailHeader } from "./DetailHeader";
import { PaperDetailShell } from "./PaperDetailShell.client";
import type { ApiPaper } from "@/src/shared/types/api";

interface PaperDetailServerProps {
  paperId: string;
}

export async function PaperDetailServer({ paperId }: PaperDetailServerProps) {
  const raw = await getPaperById(paperId);
  if (!raw) {
    return (
      <div className="max-w-[900px] mx-auto py-8 px-10">
        <Link
          href="?paper="
          className="text-[#6a6050] text-xs font-serif flex items-center gap-1.5 mb-5 no-underline hover:text-[#c9b89e]"
          replace
        >
          ← Back to Explorer
        </Link>
        <p className="text-[#6a6050] italic">Paper not found.</p>
      </div>
    );
  }

  const paper = mapApiPaperToExplorer(raw as unknown as ApiPaper);

  return (
    <div className="max-w-[900px] mx-auto py-8 px-10">
      <Link
        href="/author/public_explorer"
        className="text-[#6a6050] text-xs font-serif flex items-center gap-1.5 mb-5 no-underline hover:text-[#c9b89e]"
      >
        ← Back to Explorer
      </Link>

      <RetractionBanner paper={paper} />
      <DetailHeader paper={paper} />
      <PaperDetailShell paper={paper} />
    </div>
  );
}
