import { listUserPapers } from "@/src/features/papers/queries";
import { listUserContracts } from "@/src/features/contracts/queries";
import { computeActivityData } from "@/src/features/author/queries/activity";
import { PendingActionsList } from "./PendingActionsList";

interface Props {
  wallet: string;
  papersPromise: ReturnType<typeof listUserPapers>;
  contractsPromise: ReturnType<typeof listUserContracts>;
}

export async function PendingSection({ wallet, papersPromise, contractsPromise }: Props) {
  const [papers, contracts] = await Promise.all([papersPromise, contractsPromise]);
  const { pendingActions } = computeActivityData(wallet, papers, contracts);
  return <PendingActionsList actions={pendingActions} />;
}
