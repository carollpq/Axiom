import { NextRequest, NextResponse } from 'next/server';
import { isStorageConfigured, uploadToIPFS } from '@/src/shared/lib/pinata';
import { getSession } from '@/src/shared/lib/auth/auth';
import type { UploadFolder } from '@/src/shared/lib/pinata';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const wallet = await getSession();
  if (!wallet)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  // File size limit: 50MB
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File too large (max 50MB)' },
      { status: 413 },
    );
  }

  // Verify hash matches uploaded file (read once, reuse buffer for upload)
  const arrayBuffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const computedHash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  if (computedHash !== hash) {
    return NextResponse.json({ error: 'Hash mismatch' }, { status: 400 });
  }

  try {
    const fileName = `${folder}/${hash}`;
    const verified = new File([arrayBuffer], file.name, { type: file.type });
    const cid = await uploadToIPFS(verified, fileName);
    return NextResponse.json({ cid });
  } catch (err) {
    console.error('[IPFS] Upload failed:', err);
    return NextResponse.json(
      { error: 'Failed to upload to IPFS' },
      { status: 500 },
    );
  }
}
