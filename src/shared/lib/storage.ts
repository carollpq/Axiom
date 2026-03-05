const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY =
  process.env.PINATA_GATEWAY_URL || "https://gateway.pinata.cloud";

export function isStorageConfigured(): boolean {
  return !!PINATA_JWT;
}

/**
 * Upload a file to IPFS via Pinata and return the CID string.
 */
export async function uploadToIPFS(
  file: Blob & { name?: string },
  fileName: string,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, fileName);

  const metadata = JSON.stringify({ name: fileName });
  formData.append("pinataMetadata", metadata);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`Pinata upload failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.IpfsHash;
}

/**
 * Fetch a file from IPFS via the Pinata gateway.
 */
export async function getFileFromIPFS(cid: string): Promise<Buffer> {
  const res = await fetch(`${PINATA_GATEWAY}/ipfs/${cid}`);
  if (!res.ok) throw new Error(`IPFS fetch failed: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
