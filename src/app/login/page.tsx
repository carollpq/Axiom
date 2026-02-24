import { redirect } from "next/navigation";
import { getSession } from "@/src/shared/lib/auth";
import { LoginClient } from "./login.client";

export default async function LoginPage() {
  const wallet = await getSession();
  if (wallet) redirect("/");

  return <LoginClient />;
}
