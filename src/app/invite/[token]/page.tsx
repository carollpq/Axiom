import { getContributorByInviteToken } from "@/src/features/contracts/queries";
import { InviteClaimClient } from "@/src/features/researcher/components/contract/InviteClaimClient";
import Link from "next/link";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const data = await getContributorByInviteToken(token);

  if (!data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#1a1816" }}
      >
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="text-[#d4645a] text-lg mb-2">{"\u2715"} Invalid or Expired Invite</div>
          <p className="text-[13px] text-[#6a6050] mb-6">
            This invite link is no longer valid. It may have expired (links are valid for 7 days) or already been used.
          </p>
          <Link
            href="/"
            className="text-[12px] text-[#5a7a9a] hover:text-[#7a9fc7]"
          >
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  const { contributor, contract } = data;

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#1a1816" }}
    >
      <div className="max-w-lg w-full mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-6">
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-2">Authorship Contract Invite</div>
          <h1 className="text-[22px] font-normal text-[#e8e0d4] font-serif">{contract.paperTitle}</h1>
        </div>

        {/* Your slot */}
        <div
          className="rounded-lg p-4 mb-5"
          style={{ background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.2)" }}
        >
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.2px] mb-3">Your Contribution</div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] text-[#5a5040] mb-0.5">Wallet</div>
              <div className="text-[11px] text-[#5a7a9a] font-mono break-all">{contributor.contributorWallet}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#5a5040] mb-0.5">Share</div>
              <div className="text-[13px] text-[#d4ccc0]">{contributor.contributionPct}%</div>
            </div>
            <div>
              <div className="text-[10px] text-[#5a5040] mb-0.5">Role</div>
              <div className="text-[12px] text-[#8a8070]">{contributor.roleDescription ?? "—"}</div>
            </div>
          </div>
        </div>

        {/* All contributors */}
        <div
          className="rounded-lg p-4 mb-6"
          style={{ background: "rgba(30,28,24,0.4)", border: "1px solid rgba(120,110,95,0.15)" }}
        >
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.2px] mb-3">All Contributors</div>
          <div className="flex flex-col gap-2">
            {contract.contributors.map((c) => (
              <div key={c.contributorWallet} className="flex justify-between items-center">
                <div className="text-[11px] text-[#8a8070] font-mono">
                  {c.contributorWallet.slice(0, 10)}…{c.contributorWallet.slice(-6)}
                </div>
                <div className="text-[11px] text-[#6a6050]">{c.contributionPct}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sign action */}
        <InviteClaimClient
          contributorWallet={contributor.contributorWallet}
          contractId={contract.id}
          contract={contract}
        />
      </div>
    </div>
  );
}
