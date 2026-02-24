import { createAuth } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";
import { client } from "@/src/shared/lib/thirdweb";
import { cookies } from "next/headers";
import type { LoginPayload } from "thirdweb/auth";

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

const SEVEN_DAYS = 60 * 60 * 24 * 7;
const isProd = process.env.NODE_ENV === "production";

export async function getLoginPayload(params: {
  address: string;
  chainId?: number;
}) {
  "use server";
  return auth.generatePayload(params);
}

export async function doLogin(params: {
  payload: LoginPayload;
  signature: string;
}) {
  "use server";
  const verified = await auth.verifyPayload(params);
  if (!verified.valid) throw new Error("Invalid login payload");

  const jwt = await auth.generateJWT({ payload: verified.payload });
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, jwt, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: SEVEN_DAYS,
    path: "/",
  });
}

export async function doLogout() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

export async function isLoggedIn(address: string): Promise<boolean> {
  "use server";
  const session = await getSession();
  return session === address.toLowerCase();
}
