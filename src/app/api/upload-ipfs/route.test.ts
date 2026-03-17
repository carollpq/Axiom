/**
 * Tests for POST /api/upload-ipfs — IPFS upload route.
 */

import { NextRequest } from 'next/server';
import {
  mockGetSession,
  resetAuthMocksUnauthenticated,
} from '../../../../tests/mocks/auth';

// --- Mocks ---

jest.mock('@/src/shared/lib/auth/auth', () => ({
  get getSession() {
    return mockGetSession;
  },
}));

const mockIsStorageConfigured = jest.fn();
const mockUploadToIPFS = jest.fn();
jest.mock('@/src/shared/lib/pinata', () => ({
  get isStorageConfigured() {
    return mockIsStorageConfigured;
  },
  get uploadToIPFS() {
    return mockUploadToIPFS;
  },
}));

// Mock crypto.subtle.digest
const mockDigest = jest.fn();
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: { digest: mockDigest },
  },
  writable: true,
});

import { POST } from './route';

// Helper to create FormData requests
function makeRequest(fields: Record<string, string | File>): NextRequest {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  return new NextRequest('http://localhost:3000/api/upload-ipfs', {
    method: 'POST',
    body: formData,
  });
}

function makeFile(
  content: string,
  name = 'test.pdf',
  type = 'application/pdf',
): File {
  return new File([content], name, { type });
}

// A deterministic hash for "hello"
const HELLO_HASH =
  '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue('0xwallet');
  mockIsStorageConfigured.mockReturnValue(true);
  mockUploadToIPFS.mockResolvedValue('QmCID123');

  // Return hash bytes that match HELLO_HASH regardless of input (tests override for mismatch)
  const hashBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    hashBytes[i] = parseInt(HELLO_HASH.slice(i * 2, i * 2 + 2), 16);
  }
  mockDigest.mockResolvedValue(hashBytes.buffer);
});

describe('POST /api/upload-ipfs', () => {
  it('returns 401 without session', async () => {
    resetAuthMocksUnauthenticated();
    const req = makeRequest({
      file: makeFile('hello'),
      hash: HELLO_HASH,
      folder: 'papers',
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 503 when storage not configured', async () => {
    mockIsStorageConfigured.mockReturnValue(false);
    const req = makeRequest({
      file: makeFile('hello'),
      hash: HELLO_HASH,
      folder: 'papers',
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it('returns 400 when file is missing', async () => {
    const req = makeRequest({ hash: HELLO_HASH, folder: 'papers' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when hash is missing', async () => {
    const req = makeRequest({ file: makeFile('hello'), folder: 'papers' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when folder is missing', async () => {
    const req = makeRequest({ file: makeFile('hello'), hash: HELLO_HASH });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid folder', async () => {
    const req = makeRequest({
      file: makeFile('hello'),
      hash: HELLO_HASH,
      folder: 'invalid',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid folder');
  });

  it('returns 413 for files > 50MB', async () => {
    // Use a sparse ArrayBuffer to avoid allocating 51MB of actual memory
    const buf = new ArrayBuffer(51 * 1024 * 1024 + 1);
    const file = new File([buf], 'big.pdf', { type: 'application/pdf' });
    const req = makeRequest({ file, hash: HELLO_HASH, folder: 'papers' });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('returns 400 for hash mismatch', async () => {
    // Return a different hash
    mockDigest.mockResolvedValue(new Uint8Array(32).buffer);
    const req = makeRequest({
      file: makeFile('hello'),
      hash: HELLO_HASH,
      folder: 'papers',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Hash mismatch');
  });

  it('returns CID on success', async () => {
    const req = makeRequest({
      file: makeFile('hello'),
      hash: HELLO_HASH,
      folder: 'papers',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cid).toBe('QmCID123');
  });

  it('calls uploadToIPFS with correct filename', async () => {
    const req = makeRequest({
      file: makeFile('hello'),
      hash: HELLO_HASH,
      folder: 'papers',
    });
    await POST(req);
    expect(mockUploadToIPFS).toHaveBeenCalledWith(
      expect.any(File),
      `papers/${HELLO_HASH}`,
    );
  });

  it('returns 500 when uploadToIPFS throws', async () => {
    mockUploadToIPFS.mockRejectedValue(new Error('Pinata down'));
    const req = makeRequest({
      file: makeFile('hello'),
      hash: HELLO_HASH,
      folder: 'papers',
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('accepts "datasets" folder', async () => {
    const req = makeRequest({
      file: makeFile('data'),
      hash: HELLO_HASH,
      folder: 'datasets',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('accepts "environments" folder', async () => {
    const req = makeRequest({
      file: makeFile('env'),
      hash: HELLO_HASH,
      folder: 'environments',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
