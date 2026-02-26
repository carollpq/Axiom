"use client";

import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { decryptFileWithLit } from "@/src/shared/lib/lit/decrypt";

interface DecryptButtonProps {
  paperId: string;
  hasLitData: boolean;
}

export function DecryptButton({ paperId, hasLitData }: DecryptButtonProps) {
  const account = useActiveAccount();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!hasLitData) {
    return (
      <div className="mt-3.5 text-[11px] text-[#6a6050] italic">
        No encrypted file available.
      </div>
    );
  }

  if (!account) {
    return (
      <div className="mt-3.5 text-[11px] text-[#6a6050] italic">
        Connect wallet to decrypt and view this paper.
      </div>
    );
  }

  async function handleDecrypt() {
    if (!account) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/papers/${paperId}/content`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const { ciphertext, dataToEncryptHash, accessConditionsJson } = await res.json() as {
        ciphertext: string;
        dataToEncryptHash: string | null;
        accessConditionsJson: string | null;
      };

      if (!dataToEncryptHash || !accessConditionsJson) {
        throw new Error("Missing Lit encryption metadata");
      }

      const conditions = JSON.parse(accessConditionsJson);
      const decryptedData = await decryptFileWithLit(
        ciphertext,
        dataToEncryptHash,
        conditions,
        account.address,
        (msg: string) => account.signMessage({ message: msg }),
      );

      const blob = new Blob([decryptedData.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Decryption failed");
      setStatus("error");
    }
  }

  return (
    <div className="mt-3.5">
      <button
        onClick={handleDecrypt}
        disabled={status === "loading"}
        className="rounded py-2 px-[18px] text-[#c9b89e] text-xs cursor-pointer font-serif disabled:opacity-50"
        style={{ background: "none", border: "1px solid rgba(180,160,120,0.25)" }}
      >
        {status === "loading" ? "Decrypting\u2026" : "Decrypt & View \u2197"}
      </button>
      {status === "error" && errorMsg && (
        <div className="mt-2 text-[11px] text-[#d4645a]">{errorMsg}</div>
      )}
    </div>
  );
}
