export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import {
  getPaperById,
  canAccessPaperContent,
} from '@/src/features/papers/queries';
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

  // Authorization: owner, co-author, or editor of a journal with a submission for this paper
  const isOwner = paper.owner?.walletAddress?.toLowerCase() === session;
  const isContributor =
    paper.contracts?.some((c) =>
      c.contributors?.some(
        (contrib) => contrib.contributorWallet?.toLowerCase() === session,
      ),
    ) ?? false;

  const isAuthorized =
    isOwner || isContributor || (await canAccessPaperContent(id, session));

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

  let buffer: Buffer;
  try {
    buffer = await getFileFromIPFS(latestVersion.fileStorageKey);
  } catch (err) {
    console.error(
      `[papers/${id}/content] IPFS fetch failed for CID ${latestVersion.fileStorageKey}:`,
      err,
    );
    return NextResponse.json(
      { error: 'Failed to fetch paper content from storage' },
      { status: 502 },
    );
  }

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

  return NextResponse.json(
    {
      ciphertext: buffer.toString('base64'),
      dataToEncryptHash: paper.litDataToEncryptHash ?? null,
      accessConditionsJson: paper.litAccessConditionsJson ?? null,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    },
  );
}
