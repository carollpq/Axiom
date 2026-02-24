import { createAuth } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";
import { client } from "@/src/shared/lib/thirdweb";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "tw_auth_token";

export const auth = createAuth({
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000",
  client,
  adminAccount: privateKeyToAccount({
    client,
    privateKey: process.env.AUTH_PRIVATE_KEY ?? "",
  }),
});

// Reads JWT cookie → verifies → returns lowercase wallet address, or null
export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(AUTH_COOKIE)?.value;
  if (!jwt) return null;
  try {
    const result = await auth.verifyJWT({ jwt });
    if (!result.valid) return null;
    const sub = result.parsedJWT.sub;
    if (!sub) return null;
    return sub.toLowerCase();
  } catch {
    return null;
  }
}

