"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { validateOrcidFormat } from "@/src/shared/lib/validation";

export type UserRole = "researcher" | "reviewer" | "editor" | null;
export type OnboardingStep = "connect" | "orcid" | "role_selection" | "complete";

export function useOnboarding() {
  const account = useActiveAccount();
  const [onboardingStep, setOnboardingStep] =
    useState<OnboardingStep>("connect");
  const [orcidId, setOrcidId] = useState("");
  const [orcidError, setOrcidError] = useState("");
  const [isValidatingOrcid, setIsValidatingOrcid] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);

  // Check if user is already registered when wallet connects
  useEffect(() => {
    if (account?.address) {
      checkExistingUser(account.address);
    } else {
      setOnboardingStep("connect");
      setOrcidId("");
      setSelectedRole(null);
      setIsExistingUser(null);
    }
  }, [account?.address]);

  // Check if user is already registered via existing auth session
  const checkExistingUser = async (_walletAddress: string) => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        setOnboardingStep("complete");
        setIsExistingUser(true);
      } else {
        setOnboardingStep("orcid");
        setIsExistingUser(false);
      }
    } catch (error) {
      console.error("Error checking existing user:", error);
      setOnboardingStep("orcid");
    }
  };

  // Handle ORCID submission
  const handleOrcidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrcidError("");

    if (!validateOrcidFormat(orcidId)) {
      setOrcidError(
        "Invalid ORCID format. Please use format: XXXX-XXXX-XXXX-XXXX"
      );
      return;
    }

    setIsValidatingOrcid(true);

    try {
      // TODO: Validate ORCID with ORCID API or smart contract
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const isValid = true;

      if (isValid) {
        // TODO: Check if ORCID is already registered
        const orcidExists = true;
        if (orcidExists) setOnboardingStep("role_selection");
      } else {
        setOrcidError("ORCID not found. Please check and try again.");
      }
    } catch (error) {
      console.error("Error validating ORCID:", error);
      setOrcidError("Failed to validate ORCID. Please try again.");
    } finally {
      setIsValidatingOrcid(false);
    }
  };

  // Handle role selection and registration
  const handleRoleSelection = async (role: UserRole) => {
    if (!role || !account?.address) return;

    setSelectedRole(role);

    try {
      // TODO: Register user in smart contract
      console.log("Registering new user:", {
        walletAddress: account.address,
        orcidId,
        role,
        timestamp: new Date().toISOString(),
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));
      setOnboardingStep("complete");
    } catch (error) {
      console.error("Error registering user:", error);
      alert("Failed to register. Please try again.");
    }
  };

  return {
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
  };
}
