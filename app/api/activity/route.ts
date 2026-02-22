import { NextRequest, NextResponse } from "next/server";
import { listUserPapers } from "@/features/papers";
import { listUserContracts } from "@/features/contracts";
import type { PendingAction, ActivityItem } from "@/types/dashboard";

export const runtime = "nodejs";

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "1 month ago";
  return `${Math.floor(diffDays / 30)} months ago`;
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json(
      { error: "wallet query param required" },
      { status: 400 },
    );
  }

  // Drizzle SQLite sync driver returns arrays at runtime; cast for TypeScript
  const papers = listUserPapers(wallet) as Array<{
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
  }>;
  const contracts = listUserContracts(wallet) as Array<{
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
  }>;

  // ── Pending Actions ────────────────────────────────────────────────────────
  const pendingActions: PendingAction[] = [];

  for (const p of papers) {
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

  // Also surface contracts needing the user's own signature
  for (const c of contracts) {
    if (c.status === "pending_signatures") {
      const unsigned = c.contributors.find(
        (contrib) =>
          contrib.contributorWallet.toLowerCase() === wallet.toLowerCase() &&
          contrib.status === "pending",
      );
      if (unsigned) {
        // Avoid duplicate if already added from paper status
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
  const activity: TimedActivity[] = [];

  for (const p of papers) {
    activity.push({
      text: `You created "${p.title}"`,
      time: formatRelativeTime(p.createdAt),
      _ts: p.createdAt,
    });

    if (p.status === "registered" || p.status !== "draft") {
      // Paper was registered on-chain if it has a version with a hash
      const hasHash = p.versions.some((v) => v.paperHash);
      if (hasHash && p.status !== "draft") {
        activity.push({
          text: `You registered "${p.title}" on-chain`,
          time: formatRelativeTime(p.updatedAt),
          _ts: p.updatedAt,
        });
      }
    }

    if (p.status === "published") {
      activity.push({
        text: `"${p.title}" was published`,
        time: formatRelativeTime(p.updatedAt),
        _ts: p.updatedAt,
      });
    }
  }

  for (const c of contracts) {
    activity.push({
      text: `You created authorship contract for "${c.paperTitle}"`,
      time: formatRelativeTime(c.createdAt),
      _ts: c.createdAt,
    });

    if (c.status === "fully_signed") {
      activity.push({
        text: `Authorship contract for "${c.paperTitle}" is fully signed`,
        time: formatRelativeTime(c.updatedAt),
        _ts: c.updatedAt,
      });
    }

    for (const contrib of c.contributors) {
      if (contrib.status === "signed" && contrib.signedAt && !contrib.isCreator) {
        activity.push({
          text: `${contrib.contributorName ?? contrib.contributorWallet} signed the authorship contract for "${c.paperTitle}"`,
          time: formatRelativeTime(contrib.signedAt),
          _ts: contrib.signedAt,
        });
      }
    }
  }

  // Sort newest first, drop internal timestamp, limit to 20
  activity.sort((a, b) => b._ts.localeCompare(a._ts));
  const activityOut: ActivityItem[] = activity
    .slice(0, 20)
    .map(({ _ts: _, ...rest }) => rest);

  return NextResponse.json({ pendingActions, activity: activityOut });
}
