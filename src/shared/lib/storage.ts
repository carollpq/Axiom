import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { UploadFolder } from "@/src/shared/lib/upload";

export function isStorageConfigured(): boolean {
  return !!(
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_ENDPOINT
  );
}

let _client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: process.env.S3_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client;
}

/**
 * Generate a presigned PUT URL for direct-to-R2 upload.
 * Object key = `{folder}/{hash}` (content-addressed storage).
 * URL expires in 15 minutes per architecture spec.
 */
export async function getPresignedUploadUrl(
  hash: string,
  contentType: string,
  folder: UploadFolder,
): Promise<{ uploadUrl: string; objectKey: string }> {
  const objectKey = `${folder}/${hash}`;
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: objectKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: 15 * 60, // 15 minutes
  });

  return { uploadUrl, objectKey };
}

/**
 * Fetch an object from R2 and return its full contents as a Buffer.
 */
export async function getFileFromR2(objectKey: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: objectKey,
  });

  const response = await getS3Client().send(command);
  if (!response.Body) throw new Error("Empty response body from R2");

  // ReadableStream → Buffer (Node.js environment)
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
