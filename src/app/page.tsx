import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/src/shared/lib/auth";
import { db } from "@/src/shared/lib/db";
import { users } from "@/src/shared/lib/db/schema";

export default async function RootPage() {
  const wallet = await getSession();

  if (!wallet) {
    redirect("/onboarding");
  }

  const [user] = await db
    .select({ roles: users.roles })
    .from(users)
    .where(eq(users.walletAddress, wallet))
    .limit(1);

  if (!user || !user.roles || user.roles.length === 0) {
    redirect("/onboarding");
  }

  const primaryRole = user.roles[0];

  if (primaryRole === "reviewer") {
    redirect("/reviewer");
  }

  if (primaryRole === "editor" || primaryRole === "journal") {
    redirect("/journal");
  }

  // Default: researcher / author
  redirect("/dashboard");
}
