/**
 * Tests for papers/actions.ts — Server Actions with auth, Zod validation,
 * mutation delegation, and HCS anchoring.
 */

import {
  mockRequireSession,
  resetAuthMocks,
  resetAuthMocksUnauthenticated,
} from '../../../tests/mocks/auth';
import { TEST_WALLET } from '../../../tests/helpers/fixtures';
import { flushAfterCallbacks } from '../../../tests/setup';

// --- Mocks ---

const mockCreatePaper = jest.fn();
const mockUpdatePaper = jest.fn();
const mockCreatePaperVersion = jest.fn();
const mockUpdatePaperVersionHedera = jest.fn();

jest.mock('@/src/shared/lib/auth/auth', () => ({
  requireSession: mockRequireSession,
}));

jest.mock('@/src/features/papers/mutations', () => ({
  createPaper: mockCreatePaper,
  updatePaper: mockUpdatePaper,
  createPaperVersion: mockCreatePaperVersion,
  updatePaperVersionHedera: mockUpdatePaperVersionHedera,
}));

const mockRequirePaperOwner = jest.fn();
const mockGetPaperById = jest.fn();
jest.mock('@/src/features/papers/queries', () => ({
  requirePaperOwner: mockRequirePaperOwner,
  getPaperById: mockGetPaperById,
}));

const mockGetContractById = jest.fn();
jest.mock('@/src/features/contracts/queries', () => ({
  getContractById: mockGetContractById,
}));

const mockGetUserByWallet = jest.fn();
jest.mock('@/src/features/users/queries', () => ({
  getUserByWallet: mockGetUserByWallet,
}));

const mockCreateSubmission = jest.fn();
const mockUpdateSubmissionHedera = jest.fn();
jest.mock('@/src/features/submissions/mutations', () => ({
  createSubmission: mockCreateSubmission,
  updateSubmissionHedera: mockUpdateSubmissionHedera,
}));

const mockAnchorToHcs = jest.fn();
jest.mock('@/src/shared/lib/hedera/hcs', () => ({
  anchorToHcs: mockAnchorToHcs,
}));

// Mock db for submitPaperAction's version lookup and registerVersionAction's status update
const mockDbSelectLimit = jest.fn();
const mockDbSelectOrderBy = jest.fn(() => ({ limit: mockDbSelectLimit }));
const mockDbSelectWhere = jest.fn(() => ({ orderBy: mockDbSelectOrderBy }));
const mockDbSelectFrom = jest.fn(() => ({ where: mockDbSelectWhere }));
const mockDbUpdateWhere = jest.fn().mockResolvedValue(undefined);
const mockDbUpdateSet = jest.fn(() => ({ where: mockDbUpdateWhere }));
jest.mock('@/src/shared/lib/db', () => ({
  db: {
    select: jest.fn(() => ({ from: mockDbSelectFrom })),
    update: jest.fn(() => ({ set: mockDbUpdateSet })),
  },
}));
jest.mock('@/src/shared/lib/db/schema', () => ({
  paperVersions: { paperId: 'paperId', versionNumber: 'versionNumber' },
  papers: { id: 'id', status: 'status' },
  STUDY_TYPE_VALUES: [
    'original',
    'negative_result',
    'replication',
    'replication_failed',
    'meta_analysis',
  ],
}));
jest.mock('drizzle-orm', () => ({
  and: jest.fn(),
  eq: jest.fn(),
  desc: jest.fn(),
}));

let actions: typeof import('./actions');

beforeAll(async () => {
  actions = await import('./actions');
});

beforeEach(() => {
  jest.clearAllMocks();
  resetAuthMocks(TEST_WALLET);
  mockAnchorToHcs.mockResolvedValue({
    txId: 'tx-1',
    consensusTimestamp: 'ts-1',
  });
});

// ===========================================================================
// createPaperAction
// ===========================================================================

describe('createPaperAction', () => {
  const validInput = {
    title: 'My Great Paper',
    abstract: 'A sufficiently long abstract for testing validation rules here.',
  };

  beforeEach(() => {
    mockCreatePaper.mockResolvedValue({
      id: 'paper-1',
      title: validInput.title,
    });
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(actions.createPaperAction(validInput)).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('delegates to createPaper mutation', async () => {
    await actions.createPaperAction(validInput);
    expect(mockCreatePaper).toHaveBeenCalledWith(
      expect.objectContaining({ title: validInput.title, wallet: TEST_WALLET }),
    );
  });

  it('throws when createPaper returns null (user not found)', async () => {
    mockCreatePaper.mockResolvedValue(null);
    await expect(actions.createPaperAction(validInput)).rejects.toThrow(
      'User not found',
    );
  });

  it('anchors to HCS via after()', async () => {
    await actions.createPaperAction(validInput);
    await flushAfterCallbacks();
    expect(mockAnchorToHcs).toHaveBeenCalledWith(
      'HCS_TOPIC_PAPERS',
      expect.objectContaining({ type: 'paper_created', paperId: 'paper-1' }),
    );
  });

  it('returns created paper', async () => {
    const result = await actions.createPaperAction(validInput);
    expect(result).toEqual({ id: 'paper-1', title: validInput.title });
  });

  // Zod validation
  it('rejects title shorter than min', async () => {
    await expect(
      actions.createPaperAction({ ...validInput, title: 'ab' }),
    ).rejects.toThrow();
  });

  it('rejects empty abstract', async () => {
    await expect(
      actions.createPaperAction({ ...validInput, abstract: '' }),
    ).rejects.toThrow();
  });

  it('accepts optional studyType', async () => {
    await actions.createPaperAction({
      ...validInput,
      studyType: 'meta_analysis',
    });
    expect(mockCreatePaper).toHaveBeenCalledWith(
      expect.objectContaining({ studyType: 'meta_analysis' }),
    );
  });
});

// ===========================================================================
// updatePaperAction
// ===========================================================================

describe('updatePaperAction', () => {
  beforeEach(() => {
    mockRequirePaperOwner.mockResolvedValue(undefined);
    mockUpdatePaper.mockResolvedValue({ id: 'paper-1', title: 'Updated' });
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.updatePaperAction('paper-1', { title: 'New' }),
    ).rejects.toThrow('Unauthorized');
  });

  it('checks paper ownership', async () => {
    await actions.updatePaperAction('paper-1', { title: 'New' });
    expect(mockRequirePaperOwner).toHaveBeenCalledWith('paper-1', TEST_WALLET);
  });

  it('delegates to updatePaper', async () => {
    await actions.updatePaperAction('paper-1', { title: 'New' });
    expect(mockUpdatePaper).toHaveBeenCalledWith('paper-1', { title: 'New' });
  });

  it('throws when updatePaper returns null', async () => {
    mockUpdatePaper.mockResolvedValue(null);
    await expect(
      actions.updatePaperAction('paper-1', { title: 'X' }),
    ).rejects.toThrow('Not found or no valid fields');
  });

  it('throws when ownership check fails', async () => {
    mockRequirePaperOwner.mockRejectedValue(new Error('Forbidden'));
    await expect(
      actions.updatePaperAction('paper-1', { title: 'X' }),
    ).rejects.toThrow('Forbidden');
  });
});

// ===========================================================================
// registerVersionAction
// ===========================================================================

describe('registerVersionAction', () => {
  const validInput = {
    paperId: '550e8400-e29b-41d4-a716-446655440000',
    paperHash: 'a'.repeat(64),
  };

  beforeEach(() => {
    mockRequirePaperOwner.mockResolvedValue(undefined);
    mockCreatePaperVersion.mockResolvedValue({ id: 'v1', versionNumber: 1 });
    mockUpdatePaperVersionHedera.mockResolvedValue({
      id: 'v1',
      versionNumber: 1,
      hederaTxId: 'tx-1',
      hederaTimestamp: 'ts-1',
    });
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(actions.registerVersionAction(validInput)).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('checks ownership', async () => {
    await actions.registerVersionAction(validInput);
    expect(mockRequirePaperOwner).toHaveBeenCalledWith(
      validInput.paperId,
      TEST_WALLET,
    );
  });

  it('creates paper version', async () => {
    await actions.registerVersionAction(validInput);
    expect(mockCreatePaperVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        paperId: validInput.paperId,
        paperHash: validInput.paperHash,
      }),
    );
  });

  it('anchors synchronously to HCS', async () => {
    await actions.registerVersionAction(validInput);
    expect(mockAnchorToHcs).toHaveBeenCalledWith(
      'HCS_TOPIC_PAPERS',
      expect.objectContaining({
        type: 'register',
        paperHash: validInput.paperHash,
      }),
    );
  });

  it('backfills Hedera metadata on version', async () => {
    await actions.registerVersionAction(validInput);
    expect(mockUpdatePaperVersionHedera).toHaveBeenCalledWith(
      'v1',
      'tx-1',
      'ts-1',
    );
  });

  it('returns version without Hedera data when anchor returns no txId', async () => {
    mockAnchorToHcs.mockResolvedValue({
      txId: undefined,
      consensusTimestamp: undefined,
    });
    const result = await actions.registerVersionAction(validInput);
    expect(mockUpdatePaperVersionHedera).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'v1', versionNumber: 1 });
  });

  it('throws when createPaperVersion returns null', async () => {
    mockCreatePaperVersion.mockResolvedValue(null);
    await expect(actions.registerVersionAction(validInput)).rejects.toThrow(
      'Paper not found',
    );
  });

  it('rejects invalid hash format', async () => {
    await expect(
      actions.registerVersionAction({ ...validInput, paperHash: 'not-a-hash' }),
    ).rejects.toThrow();
  });

  it('rejects invalid paperId', async () => {
    await expect(
      actions.registerVersionAction({ ...validInput, paperId: 'not-uuid' }),
    ).rejects.toThrow();
  });

  it('includes optional fields when provided', async () => {
    const input = { ...validInput, datasetHash: 'b'.repeat(64) };
    await actions.registerVersionAction(input);
    expect(mockCreatePaperVersion).toHaveBeenCalledWith(
      expect.objectContaining({ datasetHash: 'b'.repeat(64) }),
    );
  });
});

// ===========================================================================
// submitPaperAction
// ===========================================================================

describe('submitPaperAction', () => {
  const validInput = {
    paperId: '550e8400-e29b-41d4-a716-446655440000',
    journalId: '660e8400-e29b-41d4-a716-446655440001',
    contractId: '770e8400-e29b-41d4-a716-446655440002',
  };

  beforeEach(() => {
    mockGetPaperById.mockResolvedValue({
      id: validInput.paperId,
      ownerId: 'user-1',
      status: 'registered',
      contracts: [
        { id: validInput.contractId, status: 'fully_signed', contributors: [] },
      ],
    });
    mockGetUserByWallet.mockResolvedValue({ id: 'user-1' });
    mockGetContractById.mockResolvedValue({
      id: validInput.contractId,
      status: 'fully_signed',
      contributors: [],
    });
    mockCreateSubmission.mockResolvedValue({ id: 'sub-1' });
    mockUpdatePaper.mockResolvedValue({
      id: validInput.paperId,
      status: 'submitted',
    });
    // Version lookup for submit
    mockDbSelectLimit.mockResolvedValue([{ id: 'v1' }]);
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(actions.submitPaperAction(validInput)).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('throws when paper not found', async () => {
    mockGetPaperById.mockResolvedValue(null);
    await expect(actions.submitPaperAction(validInput)).rejects.toThrow(
      'Paper not found',
    );
  });

  it('throws when user is not the owner', async () => {
    mockGetUserByWallet.mockResolvedValue({ id: 'other-user' });
    await expect(actions.submitPaperAction(validInput)).rejects.toThrow(
      'Forbidden',
    );
  });

  it('throws when user not found', async () => {
    mockGetUserByWallet.mockResolvedValue(null);
    await expect(actions.submitPaperAction(validInput)).rejects.toThrow(
      'Forbidden',
    );
  });

  it('throws when contract not fully signed', async () => {
    mockGetContractById.mockResolvedValue({
      id: validInput.contractId,
      status: 'pending_signatures',
      contributors: [
        {
          status: 'pending',
          contributorName: 'Bob',
          contributorWallet: '0xbob',
        },
      ],
    });
    await expect(actions.submitPaperAction(validInput)).rejects.toThrow(
      'All co-authors must sign',
    );
  });

  it('throws when no contract found', async () => {
    mockGetPaperById.mockResolvedValue({
      id: validInput.paperId,
      ownerId: 'user-1',
      status: 'registered',
      contracts: [],
    });
    mockGetContractById.mockResolvedValue(null);
    await expect(
      actions.submitPaperAction({ ...validInput, contractId: undefined }),
    ).rejects.toThrow('No authorship contract found');
  });

  it('throws when paper status is draft (not registered)', async () => {
    mockGetPaperById.mockResolvedValue({
      id: validInput.paperId,
      ownerId: 'user-1',
      status: 'draft',
      contracts: [],
    });
    mockGetContractById.mockResolvedValue({
      status: 'fully_signed',
      contributors: [],
    });
    await expect(actions.submitPaperAction(validInput)).rejects.toThrow(
      'Paper must be registered',
    );
  });

  it('allows submission when paper status is contract_pending', async () => {
    mockGetPaperById.mockResolvedValue({
      id: validInput.paperId,
      ownerId: 'user-1',
      status: 'contract_pending',
      contracts: [
        { id: validInput.contractId, status: 'fully_signed', contributors: [] },
      ],
    });
    const result = await actions.submitPaperAction(validInput);
    expect(result).toEqual({ submissionId: 'sub-1' });
  });

  it('creates submission and updates paper status', async () => {
    await actions.submitPaperAction(validInput);
    expect(mockCreateSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        paperId: validInput.paperId,
        journalId: validInput.journalId,
      }),
    );
    expect(mockUpdatePaper).toHaveBeenCalledWith(validInput.paperId, {
      status: 'submitted',
    });
  });

  it('throws when submission creation fails', async () => {
    mockCreateSubmission.mockResolvedValue(null);
    await expect(actions.submitPaperAction(validInput)).rejects.toThrow(
      'Failed to create submission',
    );
  });

  it('defers HCS anchoring via after()', async () => {
    await actions.submitPaperAction(validInput);
    await flushAfterCallbacks();
    expect(mockAnchorToHcs).toHaveBeenCalledWith(
      'HCS_TOPIC_SUBMISSIONS',
      expect.objectContaining({ type: 'submitted', submissionId: 'sub-1' }),
    );
  });

  it('returns submissionId', async () => {
    const result = await actions.submitPaperAction(validInput);
    expect(result).toEqual({ submissionId: 'sub-1' });
  });

  it('rejects invalid paperId format', async () => {
    await expect(
      actions.submitPaperAction({ ...validInput, paperId: 'bad' }),
    ).rejects.toThrow();
  });
});
