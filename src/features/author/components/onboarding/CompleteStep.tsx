"use client";

import { useRouter } from "next/navigation";
import type { UserRole } from "@/src/features/author/hooks/useOnboarding";

const ROLE_ROUTES: Record<NonNullable<UserRole>, string> = {
  researcher: "/author",
  reviewer: "/reviewer",
  editor: "/editor",
};

interface CompleteStepProps {
  walletAddress: string;
  orcidId: string;
  selectedRole: UserRole;
  isExistingUser: boolean | null;
}

export function CompleteStep({
  walletAddress,
  orcidId,
  selectedRole,
  isExistingUser,
}: CompleteStepProps) {
  const router = useRouter();

  function handleGoToDashboard() {
    const route = selectedRole ? ROLE_ROUTES[selectedRole] : "/author";
    router.push(route);
  }

  return (
    <div className="w-full max-w-md bg-zinc-900 p-6 rounded-lg border border-zinc-800">
      <div className="text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 text-green-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-100 mb-2">
          Welcome to Axiom!
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          {isExistingUser
            ? `Welcome back! You're logged in as a ${selectedRole}.`
            : `You're registered as a ${selectedRole}.`}
        </p>

        <div className="bg-zinc-800 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-400 text-sm">Wallet</span>
            <span className="text-zinc-100 text-sm font-mono">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          </div>
          {orcidId && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">ORCID</span>
              <span className="text-zinc-100 text-sm font-mono">{orcidId}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleGoToDashboard}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
