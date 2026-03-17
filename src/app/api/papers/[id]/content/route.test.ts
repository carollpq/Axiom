/**
 * Tests for GET /api/papers/[id]/content — paper content retrieval route.
 */

import { NextRequest } from 'next/server';
import { mockGetSession } from '../../../../../../tests/mocks/auth';

// --- Mocks ---

jest.mock('@/src/shared/lib/auth/auth', () => ({
  get getSession() {
    return mockGetSession;
  },
}));

const mockGetPaperById = jest.fn();
const mockCanAccessPaperContent = jest.fn();
jest.mock('@/src/features/papers/queries', () => ({
  get getPaperById() {
    return mockGetPaperById;
  },
  get canAccessPaperContent() {
    return mockCanAccessPaperContent;
  },
}));

const mockIsStorageConfigured = jest.fn();
const mockGetFileFromIPFS = jest.fn();
jest.mock('@/src/shared/lib/pinata', () => ({
  get isStorageConfigured() {
    return mockIsStorageConfigured;
  },
  get getFileFromIPFS() {
    return mockGetFileFromIPFS;
  },
}));

import { GET } from './route';

function makeRequest(
  url = 'http://localhost:3000/api/papers/paper-1/content',
): NextRequest {
  return new NextRequest(url);
}

function makeParams(id = 'paper-1') {
  return { params: Promise.resolve({ id }) };
}

const MOCK_PAPER = {
  id: 'paper-1',
  owner: { walletAddress: '0xowner' },
  contracts: [
    {
      contributors: [{ contributorWallet: '0xcontrib1' }],
    },
  ],
  versions: [{ id: 'v-1', fileStorageKey: 'QmCID123' }],
  litDataToEncryptHash: 'lit-hash-1',
  litAccessConditionsJson: '{"conditions":[]}',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue('0xowner');
  mockGetPaperById.mockResolvedValue(MOCK_PAPER);
  mockCanAccessPaperContent.mockResolvedValue(false);
  mockIsStorageConfigured.mockReturnValue(true);
  mockGetFileFromIPFS.mockResolvedValue(Buffer.from('pdf-content'));
});

describe('GET /api/papers/[id]/content', () => {
  // --- Auth ---

  it('returns 401 when no session', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // --- Paper not found ---

  it('returns 404 when paper not found', async () => {
    mockGetPaperById.mockResolvedValue(null);
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Paper not found');
  });

  // --- Authorization ---

  it('returns 200 for paper owner', async () => {
    mockGetSession.mockResolvedValue('0xowner');
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(200);
  });

  it('returns 200 for contributor', async () => {
    mockGetSession.mockResolvedValue('0xcontrib1');
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(200);
  });

  it('returns 200 for editor/reviewer via canAccessPaperContent', async () => {
    mockGetSession.mockResolvedValue('0xeditor');
    mockCanAccessPaperContent.mockResolvedValue(true);
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(200);
  });

  it('returns 403 when not authorized', async () => {
    mockGetSession.mockResolvedValue('0xrandom');
    mockCanAccessPaperContent.mockResolvedValue(false);
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  // --- No file uploaded ---

  it('returns 404 when no versions', async () => {
    mockGetPaperById.mockResolvedValue({
      ...MOCK_PAPER,
      versions: [],
    });
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('No file uploaded for this paper');
  });

  it('returns 404 when versions is undefined', async () => {
    mockGetPaperById.mockResolvedValue({
      ...MOCK_PAPER,
      versions: undefined,
    });
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('No file uploaded for this paper');
  });

  it('returns 404 when latest version has no fileStorageKey', async () => {
    mockGetPaperById.mockResolvedValue({
      ...MOCK_PAPER,
      versions: [{ id: 'v-1', fileStorageKey: null }],
    });
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(404);
  });

  // --- Storage not configured ---

  it('returns 503 when storage not configured', async () => {
    mockIsStorageConfigured.mockReturnValue(false);
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('Storage not available');
  });

  // --- Raw PDF response ---

  it('returns raw PDF with ?format=raw', async () => {
    const req = makeRequest(
      'http://localhost:3000/api/papers/paper-1/content?format=raw',
    );
    const res = await GET(req, makeParams());
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toBe('inline');
    expect(res.headers.get('Cache-Control')).toBe('private, max-age=300');
  });

  // --- JSON response (default) ---

  it('returns JSON with ciphertext, hash, and conditions', async () => {
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ciphertext).toBeDefined();
    expect(body.dataToEncryptHash).toBe('lit-hash-1');
    expect(body.accessConditionsJson).toBe('{"conditions":[]}');
  });

  it('returns null for litDataToEncryptHash when not set', async () => {
    mockGetPaperById.mockResolvedValue({
      ...MOCK_PAPER,
      litDataToEncryptHash: null,
      litAccessConditionsJson: null,
    });
    const res = await GET(makeRequest(), makeParams());
    const body = await res.json();
    expect(body.dataToEncryptHash).toBeNull();
    expect(body.accessConditionsJson).toBeNull();
  });
});
