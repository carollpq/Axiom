/**
 * Tests for rebuttals/queries.ts — Drizzle relational queries + auth guards.
 */

const mockFindFirst = jest.fn();
const mockFindMany = jest.fn();

jest.mock('@/src/shared/lib/db', () => ({
  db: {
    query: {
      rebuttals: {
        get findFirst() {
          return mockFindFirst;
        },
        get findMany() {
          return mockFindMany;
        },
      },
    },
  },
}));

jest.mock('@/src/shared/lib/db/schema', () => ({
  rebuttals: {
    id: 'id',
    submissionId: 'submissionId',
    status: 'status',
    authorWallet: 'authorWallet',
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ _eq: [a, b] })),
  and: jest.fn((...args: unknown[]) => ({ _and: args })),
}));

jest.mock('react', () => ({
  cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

import { eq } from 'drizzle-orm';
import {
  getRebuttalBySubmission,
  getRebuttalById,
  listRebuttalSubmissionsForAuthor,
  requireRebuttalAuthor,
  requireRebuttalEditor,
} from './queries';

beforeEach(() => {
  jest.clearAllMocks();
  mockFindFirst.mockResolvedValue(undefined);
  mockFindMany.mockResolvedValue([]);
});

// ===========================================================================
// getRebuttalBySubmission
// ===========================================================================

describe('getRebuttalBySubmission', () => {
  it('returns the most recent rebuttal with responses', async () => {
    const rebuttal = { id: 'r-1', responses: [{ reviewId: 'rev-1' }] };
    mockFindFirst.mockResolvedValue(rebuttal);
    const result = await getRebuttalBySubmission('sub-1');
    expect(mockFindFirst).toHaveBeenCalled();
    expect(result).toEqual(rebuttal);
  });

  it('returns undefined when no rebuttal exists', async () => {
    mockFindFirst.mockResolvedValue(undefined);
    const result = await getRebuttalBySubmission('sub-1');
    expect(result).toBeUndefined();
  });
});

// ===========================================================================
// getRebuttalById
// ===========================================================================

describe('getRebuttalById', () => {
  it('returns full rebuttal with submission tree and responses', async () => {
    const rebuttal = {
      id: 'r-1',
      submission: { paper: { owner: {} }, journal: {} },
      responses: [],
    };
    mockFindFirst.mockResolvedValue(rebuttal);
    const result = await getRebuttalById('r-1');
    expect(result).toEqual(rebuttal);
  });

  it('returns undefined when not found', async () => {
    mockFindFirst.mockResolvedValue(undefined);
    const result = await getRebuttalById('missing');
    expect(result).toBeUndefined();
  });
});

// ===========================================================================
// listRebuttalSubmissionsForAuthor
// ===========================================================================

describe('listRebuttalSubmissionsForAuthor', () => {
  it('lowercases wallet for query', async () => {
    mockFindMany.mockResolvedValue([]);
    await listRebuttalSubmissionsForAuthor('0xABCDEF');
    expect(mockFindMany).toHaveBeenCalled();
    // Verify eq was called with the lowercased wallet
    expect(eq).toHaveBeenCalledWith('authorWallet', '0xabcdef');
  });

  it('maps results to {submissionId, paperTitle, deadline, createdAt}', async () => {
    mockFindMany.mockResolvedValue([
      {
        submissionId: 'sub-1',
        deadline: '2025-03-15T00:00:00Z',
        createdAt: '2025-03-01T00:00:00Z',
        submission: {
          paper: { title: 'My Paper' },
        },
      },
    ]);
    const result = await listRebuttalSubmissionsForAuthor('0xabc');
    expect(result).toEqual([
      {
        submissionId: 'sub-1',
        paperTitle: 'My Paper',
        deadline: '2025-03-15T00:00:00Z',
        createdAt: '2025-03-01T00:00:00Z',
      },
    ]);
  });

  it('returns empty array when no open rebuttals', async () => {
    mockFindMany.mockResolvedValue([]);
    const result = await listRebuttalSubmissionsForAuthor('0xabc');
    expect(result).toEqual([]);
  });
});

// ===========================================================================
// requireRebuttalAuthor
// ===========================================================================

describe('requireRebuttalAuthor', () => {
  it('throws when rebuttal not found', async () => {
    mockFindFirst.mockResolvedValue(undefined);
    await expect(requireRebuttalAuthor('missing', '0xabc')).rejects.toThrow(
      'Rebuttal not found',
    );
  });

  it('throws Forbidden when wallet does not match author', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'r-1',
      authorWallet: '0xother',
      submission: { journal: {} },
    });
    await expect(requireRebuttalAuthor('r-1', '0xabc')).rejects.toThrow(
      'Forbidden',
    );
  });

  it('returns rebuttal when wallet matches (case-insensitive)', async () => {
    const rebuttal = {
      id: 'r-1',
      authorWallet: '0xABC',
      submission: { journal: {} },
    };
    mockFindFirst.mockResolvedValue(rebuttal);
    const result = await requireRebuttalAuthor('r-1', '0xabc');
    expect(result).toEqual(rebuttal);
  });
});

// ===========================================================================
// requireRebuttalEditor
// ===========================================================================

describe('requireRebuttalEditor', () => {
  it('throws when rebuttal not found', async () => {
    mockFindFirst.mockResolvedValue(undefined);
    await expect(requireRebuttalEditor('missing', '0xeditor')).rejects.toThrow(
      'Rebuttal not found',
    );
  });

  it('throws when submission/journal is missing', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'r-1',
      authorWallet: '0xauthor',
      submission: null,
    });
    await expect(requireRebuttalEditor('r-1', '0xeditor')).rejects.toThrow(
      'Submission not found',
    );
  });

  it('throws when journal is null on submission', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'r-1',
      authorWallet: '0xauthor',
      submission: { journal: null },
    });
    await expect(requireRebuttalEditor('r-1', '0xeditor')).rejects.toThrow(
      'Submission not found',
    );
  });

  it('throws Forbidden when wallet does not match editor', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'r-1',
      authorWallet: '0xauthor',
      submission: { journal: { editorWallet: '0xdifferent' } },
    });
    await expect(requireRebuttalEditor('r-1', '0xeditor')).rejects.toThrow(
      'Forbidden',
    );
  });

  it('returns rebuttal when wallet matches editor (case-insensitive)', async () => {
    const rebuttal = {
      id: 'r-1',
      authorWallet: '0xauthor',
      submission: { journal: { editorWallet: '0xEDITOR' } },
    };
    mockFindFirst.mockResolvedValue(rebuttal);
    const result = await requireRebuttalEditor('r-1', '0xeditor');
    expect(result).toEqual(rebuttal);
  });
});
