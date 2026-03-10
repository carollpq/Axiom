/**
 * Client-side SHA-256 hashing via Web Crypto API.
 * No paper content leaves the browser — only hashes are sent to the server.
 */

export async function sha256(input: File | string): Promise<string> {
  const data =
    input instanceof File
      ? await input.arrayBuffer()
      : new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Deterministic JSON serialization (RFC 8785).
 * Sorted keys recursively, no whitespace.
 */
export function canonicalJson(obj: object): string {
  return JSON.stringify(sortKeys(obj));
}

function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
  }
  return sorted;
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}
