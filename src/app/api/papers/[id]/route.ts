import { NextRequest, NextResponse } from 'next/server';
import { getPaperById } from '@/src/features/papers/queries';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const paper = await getPaperById(id);

  if (!paper) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json(paper);
}
