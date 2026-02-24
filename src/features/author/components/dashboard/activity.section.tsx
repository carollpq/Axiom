import { listUserPapers } from "@/features/papers/queries";
import { listUserContracts } from "@/features/contracts/queries";
import { computeActivityData } from "@/features/author/queries/activity";
import { ActivityFeed } from "./ActivityFeed";

interface Props {
  wallet: string;
  papersPromise: ReturnType<typeof listUserPapers>;
  contractsPromise: ReturnType<typeof listUserContracts>;
}

export async function ActivitySection({ wallet, papersPromise, contractsPromise }: Props) {
  const [papers, contracts] = await Promise.all([papersPromise, contractsPromise]);
  const { activity } = computeActivityData(wallet, papers, contracts);
  return <ActivityFeed items={activity} />;
}
