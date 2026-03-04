"use client";

import { useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useDecryptPaper } from "@/src/shared/hooks/useDecryptPaper";

interface DecryptButtonProps {
  paperId: string;
  hasLitData: boolean;
  /** If provided, passes the blob URL instead of opening a new window */
  onDecrypted?: (blobUrl: string) => void;
}

export function DecryptButton({ paperId, hasLitData, onDecrypted }: DecryptButtonProps) {
  const account = useActiveAccount();
  const { fileUrl, status, error, decrypt } = useDecryptPaper(
    hasLitData ? paperId : null,
  );

  // Forward blob URL to parent or open in new window
  useEffect(() => {
    if (!fileUrl) return;
    if (onDecrypted) {
      onDecrypted(fileUrl);
    } else {
      window.open(fileUrl, "_blank");
    }
  }, [fileUrl, onDecrypted]);

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

  const isDone = status === "success";

  return (
    <div className="mt-3.5">
      <button
        onClick={decrypt}
        disabled={status === "loading" || isDone}
        className="rounded py-2 px-[18px] text-[#c9b89e] text-xs cursor-pointer font-serif disabled:opacity-50"
        style={{ background: "none", border: "1px solid rgba(180,160,120,0.25)" }}
      >
        {status === "loading"
          ? "Decrypting\u2026"
          : isDone
            ? "Decrypted \u2713"
            : "Decrypt & View \u2197"}
      </button>
      {status === "error" && error && (
        <div className="mt-2 text-[11px] text-[#d4645a]">{error}</div>
      )}
    </div>
  );
}
