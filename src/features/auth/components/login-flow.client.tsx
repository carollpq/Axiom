"use client";

import { useReducer, useEffect } from "react";
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
import { ROLE_DASHBOARD_ROUTES } from "@/src/shared/lib/routes";
import type { Role } from "@/src/features/auth/types";
import { RoleSelector } from "./role-selector";
import { OrcidVerificationStep } from "./orcid-verification-step";
type Step = "role-select" | "wallet" | "orcid" | "complete";

interface State {
  step: Step;
  selectedRole?: Role;
  loading: boolean;
  error?: string;
}

type Action =
  | { type: "SELECT_ROLE"; role: Role }
  | { type: "ADVANCE_TO_ORCID" }
  | { type: "BACK" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SELECT_ROLE":
      return { ...state, selectedRole: action.role, step: "wallet" };
    case "ADVANCE_TO_ORCID":
      return { ...state, step: "orcid" };
    case "BACK":
      if (state.step === "wallet")
        return { ...state, step: "role-select", selectedRole: undefined };
      if (state.step === "orcid")
        return { ...state, step: "wallet", error: undefined };
      return state;
    case "SUBMIT_START":
      return { ...state, loading: true, error: undefined };
    case "SUBMIT_SUCCESS":
      return { ...state, step: "complete", loading: false };
    case "SUBMIT_ERROR":
      return { ...state, loading: false, error: action.error, step: "orcid" };
  }
}

const INITIAL_STATE: State = { step: "role-select", loading: false };

export function LoginFlow() {
  const router = useRouter();
  const account = useActiveAccount();
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // If wallet already connected, verify session before advancing to ORCID
  useEffect(() => {
    if (!account?.address || state.step !== "wallet") return;

    isLoggedIn(account.address).then((loggedIn) => {
      if (loggedIn) {
        dispatch({ type: "ADVANCE_TO_ORCID" });
      }
      // If not logged in, user must click ConnectButton to trigger doLogin
    });
  }, [account?.address, state.step]);

  // Redirect after successful registration
  useEffect(() => {
    if (state.step !== "complete" || !state.selectedRole) return;
    const timeout = setTimeout(() => {
      router.push(ROLE_DASHBOARD_ROUTES[state.selectedRole!]);
    }, 500);
    return () => clearTimeout(timeout);
  }, [state.step, state.selectedRole, router]);

  const handleOrcidVerified = async (orcidId: string, displayName: string) => {
    dispatch({ type: "SUBMIT_START" });

    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: state.selectedRole,
          orcidId,
          displayName,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || "Registration failed");
      }

      dispatch({ type: "SUBMIT_SUCCESS" });
    } catch (err) {
      dispatch({
        type: "SUBMIT_ERROR",
        error: err instanceof Error ? err.message : "Registration failed",
      });
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
        <RoleSelector
          onSelect={(role) => dispatch({ type: "SELECT_ROLE", role })}
        />
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
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => dispatch({ type: "BACK" })}
              className="flex-1 py-2 text-sm rounded transition-all cursor-pointer"
              style={{
                backgroundColor: "transparent",
                color: "#b0a898",
                border: "1px solid #5a4a3a",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(201, 164, 74, 0.5)";
                e.currentTarget.style.color = "#d4ccc0";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#5a4a3a";
                e.currentTarget.style.color = "#b0a898";
              }}
            >
              Back
            </button>
            {account?.address && (
              <button
                onClick={() => dispatch({ type: "ADVANCE_TO_ORCID" })}
                className="flex-1 py-2 text-sm rounded font-semibold transition-all cursor-pointer"
                style={{
                  backgroundColor: "#c9a44a",
                  color: "#1a1816",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#d4b45a";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#c9a44a";
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
          onBack={() => dispatch({ type: "BACK" })}
          loading={state.loading}
        />
      )}

      {state.step === "complete" && (
        <div
          className="text-center p-6 rounded"
          style={{ backgroundColor: "rgba(45, 42, 38, 0.6)" }}
        >
          <div className="text-lg mb-4" style={{ color: "#8fbc8f" }}>
            ✓ Authentication successful
          </div>
          <p style={{ color: "#b0a898" }}>Redirecting to dashboard...</p>
        </div>
      )}
    </div>
  );
}
