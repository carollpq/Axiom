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
  const res = await fetch(`${PINATA_GATEWAY}/ipfs/${cid}`, {
    headers: PINATA_JWT ? { Authorization: `Bearer ${PINATA_JWT}` } : {},
  });

  if (res.ok) {
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('text/html')) {
      return Buffer.from(await res.arrayBuffer());
    }
  }

  // The CID might be a directory pin (caused by filenames with slashes).
  // Try listing the directory and fetching the first file inside it.
  const pinRes = await fetch(
    `https://api.pinata.cloud/data/pinList?hashContains=${cid}&status=pinned`,
    { headers: { Authorization: `Bearer ${PINATA_JWT}` } },
  );

  if (pinRes.ok) {
    const pinData = (await pinRes.json()) as {
      rows: Array<{ metadata: { name: string }; mime_type: string }>;
    };
    const pin = pinData.rows[0];

    if (pin?.mime_type === 'directory' && pin.metadata.name) {
      // metadata.name is the original path like "papers/<hash>"
      // The inner file is at cid/<last-segment>
      const segments = pin.metadata.name.split('/');
      const innerName = segments[segments.length - 1];

      const dirRes = await fetch(`${PINATA_GATEWAY}/ipfs/${cid}/${innerName}`, {
        headers: PINATA_JWT ? { Authorization: `Bearer ${PINATA_JWT}` } : {},
      });

      if (dirRes.ok) {
        const ct = dirRes.headers.get('content-type') ?? '';
        if (!ct.includes('text/html')) {
          return Buffer.from(await dirRes.arrayBuffer());
        }
      }
    }
  }

  throw new Error(
    'Could not fetch file from IPFS. Ensure PINATA_GATEWAY_URL points to a dedicated gateway.',
  );
}
