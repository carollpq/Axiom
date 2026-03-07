import { redirect } from "next/navigation";
import { getSession } from "@/src/shared/lib/auth/auth";
import { AuthGuard } from "./auth-guard.client";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallet = await getSession();
  if (!wallet) redirect("/login");
  return <AuthGuard>{children}</AuthGuard>;
}
