import { NextResponse } from 'next/server';
import { getOrCreateUser } from '@/src/features/users/queries';
import { requireSession } from '@/src/shared/lib/api-helpers';

export const runtime = 'nodejs';

export async function GET() {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  const user = await getOrCreateUser(wallet);
  return NextResponse.json(user);
}
