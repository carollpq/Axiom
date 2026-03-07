"use client";

import type { Role } from "@/src/features/auth/types";

interface WalletConnectStepProps {
  role: Role;
  walletAddress?: string;
  onConnect: () => void;
  onBack: () => void;
  loading: boolean;
}

export function WalletConnectStep({
  role,
  walletAddress,
  onConnect,
  onBack,
  loading,
}: WalletConnectStepProps) {
  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded"
        style={{ backgroundColor: "rgba(45, 42, 38, 0.6)" }}
      >
        <p className="text-sm mb-3" style={{ color: "#b0a898" }}>
          Connect your Web3 wallet to sign in as a {role}:
        </p>

        {walletAddress ? (
          <div
            className="p-3 rounded text-sm font-mono truncate"
            style={{
              backgroundColor: "#1a1816",
              color: "#8fbc8f",
              border: "1px solid #5a7a9a",
            }}
          >
            {walletAddress}
          </div>
        ) : (
          <button
            onClick={onConnect}
            disabled={loading}
            className="w-full py-3 rounded font-semibold transition-all disabled:opacity-50"
            style={{
              backgroundColor: "#c9a44a",
              color: "#1a1816",
            }}
          >
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-2 text-sm rounded transition-all"
          style={{
            backgroundColor: "transparent",
            color: "#b0a898",
            border: "1px solid #5a4a3a",
          }}
        >
          Back
        </button>
        {walletAddress && (
          <button
            onClick={onConnect}
            disabled={loading}
            className="flex-1 py-2 text-sm rounded font-semibold transition-all disabled:opacity-50"
            style={{
              backgroundColor: "#c9a44a",
              color: "#1a1816",
            }}
          >
            {loading ? "..." : "Continue"}
          </button>
        )}
      </div>
    </div>
  );
}
