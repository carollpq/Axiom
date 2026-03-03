"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/src/shared/lib/thirdweb";
import {
  getLoginPayload,
  doLogin,
  doLogout,
  isLoggedIn,
} from "@/src/shared/lib/auth/actions";
import { RoleSelector } from "./role-selector";
import { WalletConnectStep } from "./wallet-connect-step";
import { OrcidVerificationStep } from "./orcid-verification-step";

type AuthStep = "role-select" | "wallet" | "orcid" | "complete";

interface AuthFlowState {
  step: AuthStep;
  selectedRole?: "researcher" | "editor" | "reviewer";
  walletAddress?: string;
  orcidId?: string;
  loading: boolean;
  error?: string;
}

export function LoginFlow() {
  const router = useRouter();
  const account = useActiveAccount();

  const [state, setState] = useState<AuthFlowState>({
    step: "role-select",
    loading: false,
  });

  // If wallet already connected on mount, move to ORCID step
  useEffect(() => {
    if (account?.address && state.step === "wallet") {
      setState(prev => ({
        ...prev,
        walletAddress: account.address,
        step: "orcid",
      }));
    }
  }, [account?.address, state.step]);

  const handleRoleSelect = (role: "researcher" | "editor" | "reviewer") => {
    setState(prev => ({
      ...prev,
      selectedRole: role,
      step: "wallet",
    }));
  };

  const handleOrcidVerified = async (orcidId: string) => {
    setState(prev => ({
      ...prev,
      orcidId,
      loading: true,
    }));

    try {
      const response = await fetch("/api/auth/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: account?.address || state.walletAddress,
          role: state.selectedRole,
          orcidId,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      // Route to appropriate dashboard
      const dashboardRoutes: Record<string, string> = {
        researcher: "/researcher",
        editor: "/editor",
        reviewer: "/reviewer",
      };

      setState(prev => ({ ...prev, step: "complete" }));

      // Small delay for UX
      setTimeout(() => {
        router.push(dashboardRoutes[state.selectedRole!]);
      }, 500);
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Registration failed",
        step: "orcid",
      }));
    }
  };

  const handleBack = () => {
    if (state.step === "wallet") {
      setState(prev => ({
        ...prev,
        step: "role-select",
        selectedRole: undefined,
      }));
    } else if (state.step === "orcid") {
      setState(prev => ({
        ...prev,
        step: "wallet",
        walletAddress: undefined,
        orcidId: undefined,
        error: undefined,
      }));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-serif text-4xl mb-2" style={{ color: "#d4ccc0" }}>
          Axiom
        </h1>
        <p className="text-sm" style={{ color: "#b0a898" }}>
          Blockchain-backed peer review
        </p>
      </div>

      {/* Error Alert */}
      {state.error && (
        <div
          className="mb-6 p-4 rounded border text-sm"
          style={{
            backgroundColor: "rgba(212, 100, 90, 0.1)",
            borderColor: "#d4645a",
            color: "#d4645a",
          }}
        >
          {state.error}
        </div>
      )}

      {/* Step Content */}
      {state.step === "role-select" && (
        <RoleSelector onSelect={handleRoleSelect} />
      )}

      {state.step === "wallet" && state.selectedRole && (
        <div className="space-y-4">
          <div
            className="p-4 rounded"
            style={{ backgroundColor: "rgba(45, 42, 38, 0.6)" }}
          >
            <p className="text-sm mb-3" style={{ color: "#b0a898" }}>
              Connect your Web3 wallet to sign in as a {state.selectedRole}:
            </p>

            {account?.address ? (
              <div
                className="p-3 rounded text-sm font-mono truncate"
                style={{
                  backgroundColor: "#1a1816",
                  color: "#8fbc8f",
                  border: "1px solid #5a7a9a",
                }}
              >
                {account.address}
              </div>
            ) : (
              <div className="flex justify-center">
                <ConnectButton
                  client={client}
                  auth={{ isLoggedIn, getLoginPayload, doLogin, doLogout }}
                  theme="dark"
                  connectButton={{
                    label: "Connect Wallet",
                    style: {
                      backgroundColor: "#c9a44a",
                      color: "#1a1816",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontFamily: "Georgia, serif",
                      padding: "8px 24px",
                      height: "38px",
                      fontWeight: "600",
                    },
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleBack}
              className="flex-1 py-2 text-sm rounded transition-all"
              style={{
                backgroundColor: "transparent",
                color: "#b0a898",
                border: "1px solid #5a4a3a",
              }}
            >
              Back
            </button>
            {account?.address && (
              <button
                onClick={() => setState(prev => ({ ...prev, step: "orcid" }))}
                className="flex-1 py-2 text-sm rounded font-semibold transition-all"
                style={{
                  backgroundColor: "#c9a44a",
                  color: "#1a1816",
                }}
              >
                Continue
              </button>
            )}
          </div>
        </div>
      )}

      {state.step === "orcid" && (
        <OrcidVerificationStep
          onVerified={handleOrcidVerified}
          onBack={handleBack}
          loading={state.loading}
        />
      )}

      {state.step === "complete" && (
        <div className="text-center p-6 rounded" style={{ backgroundColor: "rgba(45, 42, 38, 0.6)" }}>
          <div className="text-lg mb-4" style={{ color: "#8fbc8f" }}>
            ✓ Authentication successful
          </div>
          <p style={{ color: "#b0a898" }}>Redirecting to dashboard...</p>
        </div>
      )}
    </div>
  );
}
