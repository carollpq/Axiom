import { fetchApi } from "@/src/shared/lib/api";

export type UploadFolder = "papers" | "datasets" | "environments";

/**
 * Upload a file to R2 via presigned URL.
 * Throws on failure — callers must handle errors.
 */
export async function uploadToR2(
  file: File,
  hash: string,
  folder: UploadFolder,
): Promise<string> {
  const contentType = file.type || "application/octet-stream";

  const { uploadUrl, objectKey } = await fetchApi<{
    uploadUrl: string;
    objectKey: string;
  }>("/api/upload/presigned", {
    method: "POST",
    body: JSON.stringify({ hash, contentType, folder }),
  });

  const r2Response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  });

  if (!r2Response.ok) {
    throw new Error(`R2 PUT failed: ${r2Response.status}`);
  }

  return objectKey;
}
