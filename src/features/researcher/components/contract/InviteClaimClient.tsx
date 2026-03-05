"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/src/shared/hooks/useCurrentUser";
import { fetchApi } from "@/src/shared/lib/api";
import { hashString, canonicalJson } from "@/src/shared/lib/hashing";

interface ContractSummary {
  id: string;
  paperTitle: string;
  contributors: Array<{
    contributorWallet: string;
    contributorName: string | null;
    contributionPct: number;
    roleDescription: string | null;
  }>;
}

interface InviteClaimClientProps {
  contributorWallet: string;
  contractId: string;
  contract: ContractSummary;
}

export function InviteClaimClient({ contributorWallet, contractId, contract }: InviteClaimClientProps) {
  const { user, account } = useCurrentUser();
  const router = useRouter();
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectedWallet = user?.walletAddress ?? "";
  const walletMatches = connectedWallet.toLowerCase() === contributorWallet.toLowerCase();

  const handleSign = async () => {
    if (!account || !walletMatches) return;
    setSigning(true);
    setError(null);

    try {
      const contractPayload = {
        paperTitle: contract.paperTitle,
        contributors: contract.contributors.map((c) => ({
          wallet: c.contributorWallet,
          name: c.contributorName,
          pct: c.contributionPct,
          role: c.roleDescription,
        })),
      };
      const contractHash = await hashString(canonicalJson(contractPayload));
      const signature = await account.signMessage({ message: contractHash });

      await fetchApi(`/api/contracts/${contractId}/sign`, {
        method: "POST",
        body: JSON.stringify({
          contributorWallet,
          signature,
          contractHash,
        }),
      });

      setSigned(true);
      setTimeout(() => router.push("/researcher/authorship-contracts"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signing failed. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  if (signed) {
    return (
      <div className="text-center py-8">
        <div className="text-[#8fbc8f] text-lg mb-2">{"\u2713"} Contract Signed</div>
        <div className="text-[12px] text-[#6a6050]">Redirecting to the contract builder…</div>
      </div>
    );
  }

  if (!connectedWallet) {
    return (
      <div className="text-center py-6">
        <div className="text-[13px] text-[#8a8070] mb-3">Connect your wallet to sign this contract.</div>
        <div className="text-[11px] text-[#5a5040] font-mono">{contributorWallet}</div>
      </div>
    );
  }

  if (!walletMatches) {
    return (
      <div
        className="rounded-lg px-4 py-3 text-center"
        style={{ background: "rgba(200,100,90,0.06)", border: "1px solid rgba(200,100,90,0.2)" }}
      >
        <div className="text-[12px] text-[#d4645a] mb-1">Wrong wallet connected</div>
        <div className="text-[11px] text-[#6a6050]">
          This invite is for <span className="font-mono text-[#8a8070]">{contributorWallet}</span>.
          Connect the correct wallet to proceed.
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div
          className="rounded px-3 py-2 mb-4 text-[12px] text-[#d4645a]"
          style={{ background: "rgba(200,100,90,0.06)", border: "1px solid rgba(200,100,90,0.2)" }}
        >{error}</div>
      )}
      <button
        onClick={handleSign}
        disabled={signing}
        className="w-full py-3 rounded font-serif text-sm tracking-wide"
        style={{
          background: signing
            ? "rgba(120,110,95,0.1)"
            : "linear-gradient(135deg, rgba(180,160,120,0.25), rgba(160,140,100,0.15))",
          border: "1px solid " + (signing ? "rgba(120,110,95,0.15)" : "rgba(180,160,120,0.4)"),
          color: signing ? "#4a4238" : "#d4c8a8",
          cursor: signing ? "not-allowed" : "pointer",
        }}
      >
        {signing ? "Signing…" : "Sign this Contract"}
      </button>
    </div>
  );
}
