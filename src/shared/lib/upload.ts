export type UploadFolder = 'papers' | 'datasets' | 'environments';

/**
 * Upload a file to IPFS via the /api/upload-ipfs route.
 * Returns the CID string.
 */
export async function uploadToIPFS(
  file: File,
  hash: string,
  folder: UploadFolder,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('hash', hash);
  formData.append('folder', folder);

  const res = await fetch('/api/upload-ipfs', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(data.error || `IPFS upload failed: ${res.status}`);
  }

  const { cid } = await res.json();
  return cid;
}
