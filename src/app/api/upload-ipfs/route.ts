import { NextRequest, NextResponse } from 'next/server';
import { isStorageConfigured, uploadToIPFS } from '@/src/shared/lib/pinata';
import { requireSession } from '@/src/shared/lib/api-helpers';
import type { UploadFolder } from '@/src/shared/lib/pinata';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const wallet = await requireSession();
  if (wallet instanceof NextResponse) return wallet;

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: 'Storage not configured' },
      { status: 503 },
    );
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const hash = formData.get('hash') as string | null;
  const folder = formData.get('folder') as string | null;

  if (!file || !hash || !folder) {
    return NextResponse.json(
      { error: 'file, hash, and folder are required' },
      { status: 400 },
    );
  }

  if (!['papers', 'datasets', 'environments'].includes(folder)) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
  }

  try {
    const fileName = `${folder}/${hash}`;
    const cid = await uploadToIPFS(file, fileName);
    return NextResponse.json({ cid });
  } catch (err) {
    console.error('[IPFS] Upload failed:', err);
    return NextResponse.json(
      { error: 'Failed to upload to IPFS' },
      { status: 500 },
    );
  }
}
