import type { listUserPapers } from "@/features/papers/queries";
import type { listUserContracts } from "@/features/contracts/queries";
import type { PendingAction, ActivityItem } from "@/features/author/types/dashboard";
import { formatRelativeTime } from "@/lib/format";

type PaperRow = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  versions: { paperHash: string }[];
  contracts: {
    contributors: {
      contributorName: string | null;
      contributorWallet: string;
      status: string;
      signedAt: string | null;
      isCreator: boolean;
    }[];
  }[];
};

type ContractRow = {
  id: string;
  paperTitle: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  contributors: {
    contributorWallet: string;
    contributorName: string | null;
    status: string;
    signedAt: string | null;
    isCreator: boolean;
  }[];
};

export function computeActivityData(
  wallet: string,
  papers: Awaited<ReturnType<typeof listUserPapers>>,
  contracts: Awaited<ReturnType<typeof listUserContracts>>,
): {
  pendingActions: PendingAction[];
  activity: ActivityItem[];
} {
  const paperRows = papers as unknown as PaperRow[];
  const contractRows = contracts as unknown as ContractRow[];

  // ── Pending Actions ────────────────────────────────────────────────────────
  const pendingActions: PendingAction[] = [];

  for (const p of paperRows) {
    if (p.status === "contract_pending") {
      pendingActions.push({
        type: "sign",
        text: `Sign authorship contract for "${p.title}"`,
        time: formatRelativeTime(p.updatedAt),
        urgent: true,
      });
    } else if (p.status === "revision_requested") {
      pendingActions.push({
        type: "revision",
        text: `Revision requested for "${p.title}"`,
        time: formatRelativeTime(p.updatedAt),
        urgent: true,
      });
    } else if (p.status === "under_review") {
      pendingActions.push({
        type: "review",
        text: `Review received for "${p.title}"`,
        time: formatRelativeTime(p.updatedAt),
        urgent: false,
      });
    }
  }

  for (const c of contractRows) {
    if (c.status === "pending_signatures") {
      const unsigned = c.contributors.find(
        (contrib) =>
          contrib.contributorWallet.toLowerCase() === wallet.toLowerCase() &&
          contrib.status === "pending",
      );
      if (unsigned) {
        const alreadyListed = pendingActions.some(
          (a) => a.type === "sign" && a.text.includes(c.paperTitle),
        );
        if (!alreadyListed) {
          pendingActions.push({
            type: "sign",
            text: `Sign authorship contract for "${c.paperTitle}"`,
            time: formatRelativeTime(c.updatedAt),
            urgent: true,
          });
        }
      }
    }
  }

  // ── Activity Feed ──────────────────────────────────────────────────────────
  type TimedActivity = ActivityItem & { _ts: string };
  const activityItems: TimedActivity[] = [];

  for (const p of paperRows) {
    activityItems.push({
      text: `You created "${p.title}"`,
      time: formatRelativeTime(p.createdAt),
      _ts: p.createdAt,
    });

    const hasHash = p.versions.some((v) => v.paperHash);
    if (hasHash && p.status !== "draft") {
      activityItems.push({
        text: `You registered "${p.title}" on-chain`,
        time: formatRelativeTime(p.updatedAt),
        _ts: p.updatedAt,
      });
    }

    if (p.status === "published") {
      activityItems.push({
        text: `"${p.title}" was published`,
        time: formatRelativeTime(p.updatedAt),
        _ts: p.updatedAt,
      });
    }
  }

  for (const c of contractRows) {
    activityItems.push({
      text: `You created authorship contract for "${c.paperTitle}"`,
      time: formatRelativeTime(c.createdAt),
      _ts: c.createdAt,
    });

    if (c.status === "fully_signed") {
      activityItems.push({
        text: `Authorship contract for "${c.paperTitle}" is fully signed`,
        time: formatRelativeTime(c.updatedAt),
        _ts: c.updatedAt,
      });
    }

    for (const contrib of c.contributors) {
      if (contrib.status === "signed" && contrib.signedAt && !contrib.isCreator) {
        activityItems.push({
          text: `${contrib.contributorName ?? contrib.contributorWallet} signed the authorship contract for "${c.paperTitle}"`,
          time: formatRelativeTime(contrib.signedAt),
          _ts: contrib.signedAt,
        });
      }
    }
  }

  activityItems.sort((a, b) => b._ts.localeCompare(a._ts));
  const activity: ActivityItem[] = activityItems
    .slice(0, 20)
    .map(({ _ts: _, ...rest }) => rest);

  return { pendingActions, activity };
}
