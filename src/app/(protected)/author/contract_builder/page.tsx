import { getSession } from "@/src/shared/lib/auth/auth";
import { listUserPapers } from "@/src/features/papers/queries";
import { listUserContracts } from "@/src/features/contracts/queries";
import { mapApiPapersToDrafts } from "@/src/features/author/mappers/contract";
import { ContractBuilderClient } from "@/src/features/author/components/contract";
import type { ApiPaper, ApiContract } from "@/src/shared/types/api";

export default async function ContractBuilder() {
  // wallet is guaranteed non-null by (protected)/layout.tsx
  const wallet = (await getSession())!;

  const [papers, contracts] = await Promise.all([
    listUserPapers(wallet) as Promise<ApiPaper[]>,
    listUserContracts(wallet) as Promise<ApiContract[]>,
  ]);

  const initialDrafts = mapApiPapersToDrafts(papers, contracts);

  return <ContractBuilderClient initialDrafts={initialDrafts} />;
}
