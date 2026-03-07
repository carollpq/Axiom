/**
 * Lightweight Lit Protocol config check.
 * This file has ZERO SDK dependencies — safe to import anywhere without bundling Lit.
 */
export function isLitConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_LIT_NETWORK;
}
