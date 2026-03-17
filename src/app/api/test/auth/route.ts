/**
 * Test-only JWT endpoint for E2E cookie injection.
 * Returns 404 in production. Generates a valid JWT for a given wallet address.
 */
import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/src/shared/lib/errors';
import { testRouteGuard } from '../guard';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const guardResponse = testRouteGuard();
  if (guardResponse) return guardResponse;

  try {
    const { walletAddress } = await request.json();
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 },
      );
    }

    const { auth, AUTH_COOKIE } = await import('@/src/shared/lib/auth/auth');
    const wallet = walletAddress.toLowerCase();

    // Generate payload then use it to create a JWT.
    // Cast as any because generateJWT expects a branded VerifiedLoginPayload
    // but this is test-only code that never runs in production.
    const payload = await auth.generatePayload({ address: wallet });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jwt = await auth.generateJWT({ payload: payload as any });

    return NextResponse.json({ jwt, cookieName: AUTH_COOKIE });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
