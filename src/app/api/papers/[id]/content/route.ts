export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getPaperById } from '@/src/features/papers/queries';
import { getFileFromIPFS, isStorageConfigured } from '@/src/shared/lib/pinata';
import { getSession } from '@/src/shared/lib/auth/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const paper = await getPaperById(id);
  if (!paper) {
    return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
  }

  const latestVersion = paper.versions?.at(-1) ?? null;
  if (!latestVersion?.fileStorageKey) {
    return NextResponse.json(
      { error: 'No file uploaded for this paper' },
      { status: 404 },
    );
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: 'Storage not available' },
      { status: 503 },
    );
  }

  const buffer = await getFileFromIPFS(latestVersion.fileStorageKey);

  // Return raw PDF bytes when requested (for non-Lit-encrypted viewing)
  if (req.nextUrl.searchParams.get('format') === 'raw') {
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=300',
      },
    });
  }

  return NextResponse.json({
    ciphertext: buffer.toString('base64'),
    dataToEncryptHash: paper.litDataToEncryptHash ?? null,
    accessConditionsJson: paper.litAccessConditionsJson ?? null,
  });
}
