import { listUserPapers } from "@/src/features/papers/queries";
import { listUserContracts } from "@/src/features/contracts/queries";
import { computeActivityData } from "@/src/features/researcher/queries/activity";
import { listRebuttalSubmissionsForAuthor } from "@/src/features/rebuttals/queries";
import { listReviewsCompletedSubmissionsForAuthor } from "@/src/features/researcher/queries/reviews-completed";
import { PendingActionsList } from "./PendingActionsList";
import { formatRelativeTime } from "@/src/shared/lib/format";

interface Props {
  wallet: string;
  papersPromise: ReturnType<typeof listUserPapers>;
  contractsPromise: ReturnType<typeof listUserContracts>;
}

export async function PendingSection({ wallet, papersPromise, contractsPromise }: Props) {
  const [papers, contracts, reviewsCompletedSubs, rebuttalSubs] = await Promise.all([
    papersPromise,
    contractsPromise,
    listReviewsCompletedSubmissionsForAuthor(wallet),
    listRebuttalSubmissionsForAuthor(wallet),
  ]);
  const { pendingActions } = computeActivityData(wallet, papers, contracts);

  for (const sub of reviewsCompletedSubs) {
    pendingActions.push({
      type: "review",
      text: `Review and respond to reviews for "${sub.paperTitle}"`,
      time: formatRelativeTime(sub.submittedAt),
      urgent: true,
      link: `/researcher/review-response/${sub.submissionId}`,
    });
  }

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
