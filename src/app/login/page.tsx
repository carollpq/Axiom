"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/src/shared/context/UserContext";
import { LoginFlow } from "@/src/features/auth/components/login-flow.client";

export default function LoginPage() {
  const router = useRouter();
  const { user, isConnected } = useUser();

  useEffect(() => {
    // If user has a role, redirect to their dashboard
    if (user && user.roles && user.roles.length > 0) {
      const roleRoutes: Record<string, string> = {
        researcher: "/researcher",
        editor: "/editor",
        reviewer: "/reviewer",
      };
      const primaryRole = user.roles[0];
      router.push(roleRoutes[primaryRole] || "/researcher");
    }
  }, [user, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
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
