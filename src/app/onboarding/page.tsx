"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/src/shared/lib/thirdweb";
import { useOnboarding } from "@/src/features/researcher/hooks/useOnboarding";
import { Header } from "@/src/features/researcher/components/onboarding/Header";
import { OrcidStep } from "@/src/features/researcher/components/onboarding/OrcidStep";
import { RoleSelectionStep } from "@/src/features/researcher/components/onboarding/RoleSelectionStep";
import { CompleteStep } from "@/src/features/researcher/components/onboarding/CompleteStep";

export default function OnboardingPage() {
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
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#1a1816" }}
    >
      <div className="flex flex-col items-center gap-8 py-20 w-full max-w-screen-lg mx-auto">
        <Header />

        <ConnectButton
          client={client}
          appMetadata={{
            name: "Axiom.",
            url: "https://axiom.com",
          }}
          theme="dark"
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
    </main>
  );
}
