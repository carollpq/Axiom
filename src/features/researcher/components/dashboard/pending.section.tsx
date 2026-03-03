import { listUserPapers } from "@/src/features/papers/queries";
import { listUserContracts } from "@/src/features/contracts/queries";
import { computeActivityData } from "@/src/features/researcher/queries/activity";
import { listRebuttalSubmissionsForAuthor } from "@/src/features/rebuttals/queries";
import { PendingActionsList } from "./PendingActionsList";
import { formatRelativeTime } from "@/src/shared/lib/format";

interface Props {
  wallet: string;
  papersPromise: ReturnType<typeof listUserPapers>;
  contractsPromise: ReturnType<typeof listUserContracts>;
}

export async function PendingSection({ wallet, papersPromise, contractsPromise }: Props) {
  const [papers, contracts] = await Promise.all([papersPromise, contractsPromise]);
  const { pendingActions } = computeActivityData(wallet, papers, contracts);

  // Check for open rebuttals
  const rebuttalSubs = await listRebuttalSubmissionsForAuthor(wallet);
  for (const sub of rebuttalSubs) {
    pendingActions.push({
      type: "rebuttal",
      text: `Respond to rebuttal for "${sub.paperTitle}"`,
      time: formatRelativeTime(sub.createdAt),
      urgent: true,
      link: `/researcher/rebuttal/${sub.submissionId}`,
    });
  }

  return <PendingActionsList actions={pendingActions} />;
}
