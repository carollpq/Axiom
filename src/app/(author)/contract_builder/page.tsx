import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/src/shared/lib/auth";
import { listUserPapers } from "@/src/features/papers";
import { listUserContracts } from "@/src/features/contracts";
import { ContractBuilderClient } from "@/src/features/author/components/contract";
import { ContractBuilderSkeleton } from "@/src/features/author/components/skeletons";
import type { ApiPaper, ApiContract } from "@/src/shared/types/api";

async function ContractBuilderContent() {
  const wallet = await getSession();
  if (!wallet) redirect("/");

  const papers = listUserPapers(wallet) as unknown as ApiPaper[];
  const contracts = listUserContracts(wallet) as unknown as ApiContract[];

  return (
    <ContractBuilderClient
      initialPapers={papers}
      initialContracts={contracts}
    />
  );
}

export default function ContractBuilder() {
  return (
    <Suspense fallback={<ContractBuilderSkeleton />}>
      <ContractBuilderContent />
    </Suspense>
  );
}
