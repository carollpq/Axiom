import { getSession } from "@/src/shared/lib/auth/auth";
import { listUserPapers } from "@/src/features/papers/queries";
import { listUserContracts } from "@/src/features/contracts/queries";
import { mapApiPapersToDrafts } from "@/src/features/researcher/mappers/contract";
import { ContractBuilderClient } from "@/src/features/researcher/components/contract";
import type { ApiPaper, ApiContract } from "@/src/shared/types/api";

export default async function ContractBuilder() {
  // wallet is guaranteed non-null by (protected)/layout.tsx
  const wallet = (await getSession())!;

  const [papers, contracts] = await Promise.all([
    listUserPapers(wallet) as Promise<ApiPaper[]>,
    listUserContracts(wallet) as Promise<ApiContract[]>,
  ]);

  const initialDrafts = mapApiPapersToDrafts(papers, contracts);

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-10">
      <div className="mb-2">
        <div className="text-[11px] text-[#6a6050] mb-2">
          <span className="cursor-pointer">Dashboard</span>
          <span className="mx-2">/</span>
          <span className="text-[#8a8070]">Authorship Contract Builder</span>
        </div>
        <h1 className="text-[28px] font-normal text-[#e8e0d4] m-0">Authorship Contract Builder</h1>
        <p className="text-[13px] text-[#6a6050] mt-1.5 italic m-0">Define contributions, collect signatures, record on Hedera</p>
      </div>
      <ContractBuilderClient initialDrafts={initialDrafts} />
    </div>
  );
}
