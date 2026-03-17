/**
 * Tests for submissions/queries.ts — requireSubmissionAuthor/Editor guards.
 */

const mockFindFirst = jest.fn();

jest.mock('@/src/shared/lib/db', () => ({
  db: {
    query: {
      submissions: {
        get findFirst() {
          return mockFindFirst;
        },
      },
    },
  },
}));

jest.mock('@/src/shared/lib/db/schema', () => ({
  submissions: { id: 'id' },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ _eq: [a, b] })),
}));

import { requireSubmissionAuthor, requireSubmissionEditor } from './queries';

beforeEach(() => {
  jest.clearAllMocks();
  mockFindFirst.mockResolvedValue(null);
});

// ===========================================================================
// requireSubmissionAuthor
// ===========================================================================

describe('requireSubmissionAuthor', () => {
  it('throws when submission not found', async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(requireSubmissionAuthor('missing', '0xabc')).rejects.toThrow(
      'Submission not found',
    );
  });

  it('throws Forbidden when wallet does not match paper owner', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'sub-1',
      paper: {
        owner: { walletAddress: '0xother' },
      },
      journal: { editorWallet: '0xeditor' },
    });
    await expect(requireSubmissionAuthor('sub-1', '0xabc')).rejects.toThrow(
      'Forbidden',
    );
  });

  it('returns submission when wallet matches (case-insensitive)', async () => {
    const submission = {
      id: 'sub-1',
      paper: {
        owner: { walletAddress: '0xABC' },
      },
      journal: { editorWallet: '0xeditor' },
    };
    mockFindFirst.mockResolvedValue(submission);
    const result = await requireSubmissionAuthor('sub-1', '0xabc');
    expect(result).toEqual(submission);
  });

  it('handles null owner gracefully (throws Forbidden)', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'sub-1',
      paper: {
        owner: null,
      },
      journal: { editorWallet: '0xeditor' },
    });
    await expect(requireSubmissionAuthor('sub-1', '0xabc')).rejects.toThrow(
      'Forbidden',
    );
  });

  it('handles undefined walletAddress (throws Forbidden)', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'sub-1',
      paper: {
        owner: { walletAddress: undefined },
      },
      journal: { editorWallet: '0xeditor' },
    });
    await expect(requireSubmissionAuthor('sub-1', '0xabc')).rejects.toThrow(
      'Forbidden',
    );
  });
});

// ===========================================================================
// requireSubmissionEditor
// ===========================================================================

describe('requireSubmissionEditor', () => {
  it('throws when submission not found', async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(
      requireSubmissionEditor('missing', '0xeditor'),
    ).rejects.toThrow('Submission not found');
  });

  it('throws when journal is null', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'sub-1',
      paper: { owner: { walletAddress: '0xowner' } },
      journal: null,
    });
    await expect(requireSubmissionEditor('sub-1', '0xeditor')).rejects.toThrow(
      'Journal not found',
    );
  });

  it('throws Forbidden when wallet does not match journal editor', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'sub-1',
      paper: { owner: { walletAddress: '0xowner' } },
      journal: { editorWallet: '0xdifferent' },
    });
    await expect(requireSubmissionEditor('sub-1', '0xabc')).rejects.toThrow(
      'Forbidden',
    );
  });

  it('returns submission when wallet matches editor (case-insensitive)', async () => {
    const submission = {
      id: 'sub-1',
      paper: { owner: { walletAddress: '0xowner' } },
      journal: { editorWallet: '0xEDITOR' },
    };
    mockFindFirst.mockResolvedValue(submission);
    const result = await requireSubmissionEditor('sub-1', '0xeditor');
    expect(result).toEqual(submission);
  });
});
