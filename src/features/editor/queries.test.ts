/**
 * Tests for editor/queries.ts — DB read operations + auth guards.
 */

// Mock react.cache as passthrough
jest.mock('react', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  cache: (fn: Function) => fn,
}));

// Auth mock
const mockGetSession = jest.fn();
jest.mock('@/src/shared/lib/auth/auth', () => ({
  getSession: mockGetSession,
}));

// DB mock
const mockFindFirst = jest.fn();
const mockDb = {
  query: {
    journals: { findFirst: mockFindFirst },
  },
};
jest.mock('@/src/shared/lib/db', () => ({ db: mockDb }));
jest.mock('@/src/shared/lib/db/schema', () => ({
  journals: { id: 'journals.id', editorWallet: 'journals.editorWallet' },
  submissions: {},
  reputationScores: {},
  journalIssues: {},
  journalReviewers: {},
  users: {},
}));
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a: string, b: string) => ({ eq: [a, b] })),
  sql: Object.assign(jest.fn(), {
    raw: jest.fn(),
  }),
}));

let queries: typeof import('./queries');

beforeAll(async () => {
  queries = await import('./queries');
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ===================================================================
// requireJournalEditor
// ===================================================================

describe('requireJournalEditor', () => {
  it('throws "Journal not found" when journal does not exist', async () => {
    mockFindFirst.mockResolvedValue(undefined);
    await expect(queries.requireJournalEditor('j1', '0xabc')).rejects.toThrow(
      'Journal not found',
    );
  });

  it('throws "Forbidden" when wallet does not match', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'j1',
      editorWallet: '0xEditor',
    });
    await expect(
      queries.requireJournalEditor('j1', '0xNotEditor'),
    ).rejects.toThrow('Forbidden');
  });

  it('performs case-insensitive wallet matching', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'j1',
      editorWallet: '0xABC',
    });
    const result = await queries.requireJournalEditor('j1', '0xabc');
    expect(result.id).toBe('j1');
  });

  it('returns journal on success', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'j1',
      editorWallet: '0xeditor',
      name: 'Nature',
    });
    const result = await queries.requireJournalEditor('j1', '0xEditor');
    expect(result.name).toBe('Nature');
  });
});

// ===================================================================
// getJournalByEditorWallet
// ===================================================================

describe('getJournalByEditorWallet', () => {
  it('returns journal when found', async () => {
    mockFindFirst.mockResolvedValue({ id: 'j1', name: 'Science' });
    const result = await queries.getJournalByEditorWallet('0xeditor');
    expect(result).toEqual({ id: 'j1', name: 'Science' });
  });

  it('returns undefined when not found', async () => {
    mockFindFirst.mockResolvedValue(undefined);
    const result = await queries.getJournalByEditorWallet('0xnonexistent');
    expect(result).toBeUndefined();
  });

  it('queries with lowercased wallet', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { eq: eqFn } = require('drizzle-orm');
    mockFindFirst.mockResolvedValue(undefined);
    await queries.getJournalByEditorWallet('0xABC');
    expect(mockFindFirst).toHaveBeenCalled();
    // Verify the wallet was lowercased before being passed to eq()
    const eqCall = eqFn.mock.calls[0];
    expect(eqCall[1]).toBe('0xabc');
  });
});

// ===================================================================
// fetchEditorPageData
// ===================================================================

describe('fetchEditorPageData', () => {
  it('returns journal data for valid session', async () => {
    mockGetSession.mockResolvedValue('0xeditor');
    mockFindFirst.mockResolvedValue({ id: 'j1', name: 'Nature' });
    const result = await queries.fetchEditorPageData();
    expect(result.journal).toEqual({ id: 'j1', name: 'Nature' });
  });

  it('throws Unauthorized when session is null', async () => {
    mockGetSession.mockResolvedValue(null);
    await expect(queries.fetchEditorPageData()).rejects.toThrow('Unauthorized');
  });

  it('returns undefined journal when editor has no journal', async () => {
    mockGetSession.mockResolvedValue('0xeditor');
    mockFindFirst.mockResolvedValue(undefined);
    const result = await queries.fetchEditorPageData();
    expect(result.journal).toBeUndefined();
  });
});
