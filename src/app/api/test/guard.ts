/**
 * Shared guard for test-only API routes.
 * Returns a 404 response if called in production or without ALLOW_TEST_AUTH.
 * Returns null if the route should proceed.
 */
import { NextResponse } from 'next/server';

export function testRouteGuard(): NextResponse | null {
  if (process.env.NODE_ENV === 'production' || !process.env.ALLOW_TEST_AUTH) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return null;
}
