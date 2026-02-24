"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { useOnboarding } from "@/features/author/hooks/useOnboarding";
import { Header } from "@/features/author/components/onboarding/Header";
import { OrcidStep } from "@/features/author/components/onboarding/OrcidStep";
import { RoleSelectionStep } from "@/features/author/components/onboarding/RoleSelectionStep";
import { CompleteStep } from "@/features/author/components/onboarding/CompleteStep";

export default function Home() {
  const {
    account,
    onboardingStep,
    setOnboardingStep,
    orcidId,
    setOrcidId,
    orcidError,
    isValidatingOrcid,
    selectedRole,
    isExistingUser,
    handleOrcidSubmit,
    handleRoleSelection,
  } = useOnboarding();

  return (
    <main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center container max-w-screen-lg mx-auto">
      <div className="py-20">
        <Header />

        <div className="flex flex-col items-center gap-6">
          <ConnectButton
            client={client}
            appMetadata={{
              name: "Axiom.",
              url: "https://axiom.com",
            }}
          />

          {onboardingStep === "orcid" && account?.address && (
            <OrcidStep
              orcidId={orcidId}
              setOrcidId={setOrcidId}
              orcidError={orcidError}
              isValidatingOrcid={isValidatingOrcid}
              onSubmit={handleOrcidSubmit}
            />
          )}

          {onboardingStep === "role_selection" && account?.address && (
            <RoleSelectionStep
              onSelectRole={handleRoleSelection}
              onBack={() => setOnboardingStep("orcid")}
            />
          )}

          {onboardingStep === "complete" && account?.address && (
            <CompleteStep
              walletAddress={account.address}
              orcidId={orcidId}
              selectedRole={selectedRole}
              isExistingUser={isExistingUser}
            />
          )}
        </div>
      </div>
    </main>
  );
}
