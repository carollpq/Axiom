"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/src/shared/context/UserContext";
import { LoginFlow } from "@/src/features/auth/components/login-flow.client";
import { ROLE_DASHBOARD_ROUTES } from "@/src/shared/lib/routes";

export default function LoginPage() {
  const router = useRouter();
  const { user, isConnected } = useUser();

  useEffect(() => {
    // Only redirect if wallet is actually connected AND user has a role
    if (isConnected && user && user.roles && user.roles.length > 0) {
      const primaryRole = user.roles[0];
      router.push(ROLE_DASHBOARD_ROUTES[primaryRole] || "/researcher");
    }
  }, [isConnected, user, router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#1a1816" }}
    >
      <div
        className="w-full max-w-md p-8 rounded-lg border"
        style={{
          backgroundColor: "rgba(45,42,38,0.6)",
          borderColor: "rgba(120,110,95,0.2)",
        }}
      >
        <LoginFlow />
      </div>
    </div>
  );
}
