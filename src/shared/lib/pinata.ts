export type UploadFolder = 'papers' | 'datasets' | 'environments';

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY =
  process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud';

export function isStorageConfigured(): boolean {
  return !!PINATA_JWT;
}

/**
 * Upload a file to IPFS via Pinata and return the CID string.
 * Uses a flat filename (no slashes) to avoid creating directory pins.
 */
export async function uploadToIPFS(
  file: Blob & { name?: string },
  fileName: string,
): Promise<string> {
  const formData = new FormData();
  // Use a flat filename — slashes cause Pinata to create directory pins
  const flatName = fileName.replace(/\//g, '_');
  formData.append('file', file, flatName);

  const metadata = JSON.stringify({ name: fileName });
  formData.append('pinataMetadata', metadata);

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`Pinata upload failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.IpfsHash;
}

/**
 * Fetch a file from IPFS via gateway.
 * Handles both file CIDs and directory CIDs (where the file is inside a folder).
 */
export async function getFileFromIPFS(cid: string): Promise<Buffer> {
  const authHeaders = PINATA_JWT
    ? { Authorization: `Bearer ${PINATA_JWT}` }
    : {};

  const res = await fetch(`${PINATA_GATEWAY}/ipfs/${cid}`, {
    headers: authHeaders,
  });

  if (res.ok) {
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('text/html')) {
      return Buffer.from(await res.arrayBuffer());
    }

    // Directory pin — the gateway returns an HTML listing.
    // Parse it to find the inner file link: href="/ipfs/<cid>/<innerName>"
    const html = await res.text();
    const escaped = cid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = html.match(new RegExp(`href="/ipfs/${escaped}/([^"?]+)"`));

    if (match) {
      const innerRes = await fetch(
        `${PINATA_GATEWAY}/ipfs/${cid}/${match[1]}`,
        { headers: authHeaders },
      );
      if (innerRes.ok) {
        const ict = innerRes.headers.get('content-type') ?? '';
        if (!ict.includes('text/html')) {
          return Buffer.from(await innerRes.arrayBuffer());
        }
      }
    }
  }

  throw new Error(
    'Could not fetch file from IPFS. Ensure PINATA_GATEWAY_URL points to a dedicated gateway.',
  );
}
