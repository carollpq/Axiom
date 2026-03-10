'use server';

import { cookies } from 'next/headers';
import type { LoginPayload } from 'thirdweb/auth';
import { auth, AUTH_COOKIE } from '@/src/shared/lib/auth/auth';
import type { DbUser } from '@/src/shared/types/api';

const SEVEN_DAYS = 60 * 60 * 24 * 7;
const isProd = process.env.NODE_ENV === 'production';

export async function getLoginPayload(params: {
  address: string;
  chainId?: number;
}) {
  return auth.generatePayload(params);
}

export async function doLogin(params: {
  payload: LoginPayload;
  signature: string;
}) {
  const verified = await auth.verifyPayload(params);
  if (!verified.valid) throw new Error('Invalid login payload');

  const jwt = await auth.generateJWT({ payload: verified.payload });
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, jwt, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: SEVEN_DAYS,
    path: '/',
  });
}

export async function doLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

export async function isLoggedIn(address: string): Promise<boolean> {
  const { getSession } = await import('@/src/shared/lib/auth/auth');
  const session = await getSession();
  return session === address.toLowerCase();
}

export async function getCurrentUser(): Promise<DbUser | null> {
  const { getSession } = await import('@/src/shared/lib/auth/auth');
  const wallet = await getSession();
  if (!wallet) return null;
  const { getOrCreateUser } = await import('@/src/features/users/queries');
  return getOrCreateUser(wallet);
}
