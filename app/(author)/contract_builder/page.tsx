import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { listUserPapers } from "@/features/papers";
import { listUserContracts } from "@/features/contracts";
import { ContractBuilderClient } from "@/components/contract";
import { ContractBuilderSkeleton } from "@/components/shared/skeletons";
import type { ApiPaper, ApiContract } from "@/types/api";

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
