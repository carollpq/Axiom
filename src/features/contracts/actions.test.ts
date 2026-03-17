/**
 * Tests for contracts/actions.ts — Server Actions with auth, ownership,
 * mutation delegation, signature verification, HCS anchoring, and notifications.
 */

import {
  mockRequireSession,
  resetAuthMocks,
  resetAuthMocksUnauthenticated,
} from '../../../tests/mocks/auth';
import { TEST_WALLET, TEST_WALLET_2 } from '../../../tests/helpers/fixtures';
import { flushAfterCallbacks } from '../../../tests/setup';

// --- Mocks ---

const mockCreateContract = jest.fn();
const mockAddContributor = jest.fn();
const mockUpdateContributorFields = jest.fn();
const mockRemoveContributor = jest.fn();
const mockResetContractSignatures = jest.fn();
const mockGenerateInviteToken = jest.fn();
const mockSignContributor = jest.fn();
const mockUpdateContractHedera = jest.fn();
const mockUpdateContractSchedule = jest.fn();

jest.mock('@/src/shared/lib/auth/auth', () => ({
  requireSession: mockRequireSession,
}));

jest.mock('@/src/features/contracts/mutations', () => ({
  createContract: mockCreateContract,
  addContributor: mockAddContributor,
  updateContributorFields: mockUpdateContributorFields,
  removeContributor: mockRemoveContributor,
  resetContractSignatures: mockResetContractSignatures,
  generateInviteToken: mockGenerateInviteToken,
  signContributor: mockSignContributor,
  updateContractHedera: mockUpdateContractHedera,
  updateContractSchedule: mockUpdateContractSchedule,
}));

const mockRequireContractOwner = jest.fn();
const mockGetContractById = jest.fn();
jest.mock('@/src/features/contracts/queries', () => ({
  requireContractOwner: mockRequireContractOwner,
  getContractById: mockGetContractById,
}));

const mockCreateNotification = jest.fn();
jest.mock('@/src/features/notifications/mutations', () => ({
  createNotification: mockCreateNotification,
}));

jest.mock('@/src/features/users/lib', () => ({
  displayNameOrWallet: jest.fn(
    (name: string | null, wallet: string) => name ?? wallet.slice(0, 8),
  ),
}));

const mockVerifyMessage = jest.fn();
jest.mock('viem', () => ({
  verifyMessage: mockVerifyMessage,
}));

const mockCreateContractSchedule = jest.fn();
const mockSignScheduleAsOperator = jest.fn();
jest.mock('@/src/shared/lib/hedera/schedule', () => ({
  createContractSchedule: mockCreateContractSchedule,
  signScheduleAsOperator: mockSignScheduleAsOperator,
}));

jest.mock('@/src/shared/lib/routes', () => ({
  ROUTES: {
    researcher: { contracts: '/researcher/authorship-contracts' },
  },
}));

// Mock db for after() inline queries
const mockDbSelectFrom = jest.fn();
jest.mock('@/src/shared/lib/db', () => ({
  db: { select: jest.fn(() => ({ from: mockDbSelectFrom })) },
}));
jest.mock('@/src/shared/lib/db/schema', () => ({
  authorshipContracts: { id: 'id', paperTitle: 'paperTitle' },
  contractContributors: {},
}));
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
}));

let actions: typeof import('./actions');

beforeAll(async () => {
  actions = await import('./actions');
});

beforeEach(() => {
  jest.clearAllMocks();
  resetAuthMocks(TEST_WALLET);
  mockRequireContractOwner.mockResolvedValue(undefined);

  // Default db sequence for after() in addContributorAction
  mockDbSelectFrom.mockReturnValue({
    where: jest.fn(() => ({
      limit: jest.fn().mockResolvedValue([{ paperTitle: 'Test Paper' }]),
    })),
  });
});

// ===========================================================================
// createContractAction
// ===========================================================================

describe('createContractAction', () => {
  beforeEach(() => {
    mockCreateContract.mockResolvedValue({ id: 'c1', paperTitle: 'Test' });
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.createContractAction({ paperTitle: 'Test' }),
    ).rejects.toThrow('Unauthorized');
  });

  it('delegates to createContract', async () => {
    await actions.createContractAction({ paperTitle: 'Test' });
    expect(mockCreateContract).toHaveBeenCalledWith(
      expect.objectContaining({ paperTitle: 'Test', wallet: TEST_WALLET }),
    );
  });

  it('throws when createContract returns null', async () => {
    mockCreateContract.mockResolvedValue(null);
    await expect(
      actions.createContractAction({ paperTitle: 'Test' }),
    ).rejects.toThrow('User not found');
  });

  it('validates empty title', async () => {
    await expect(
      actions.createContractAction({ paperTitle: '' }),
    ).rejects.toThrow();
  });

  it('passes optional paperId', async () => {
    await actions.createContractAction({
      paperTitle: 'T',
      paperId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(mockCreateContract).toHaveBeenCalledWith(
      expect.objectContaining({
        paperId: '550e8400-e29b-41d4-a716-446655440000',
      }),
    );
  });
});

// ===========================================================================
// addContributorAction
// ===========================================================================

describe('addContributorAction', () => {
  const validInput = {
    contractId: '550e8400-e29b-41d4-a716-446655440000',
    contributorWallet: TEST_WALLET_2,
    contributionPct: 50,
  };

  beforeEach(() => {
    mockAddContributor.mockResolvedValue({ id: 'cc-1' });
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(actions.addContributorAction(validInput)).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('checks contract ownership', async () => {
    await actions.addContributorAction(validInput);
    expect(mockRequireContractOwner).toHaveBeenCalledWith(
      validInput.contractId,
      TEST_WALLET,
    );
  });

  it('delegates to addContributor', async () => {
    await actions.addContributorAction(validInput);
    expect(mockAddContributor).toHaveBeenCalledWith(
      expect.objectContaining({
        contractId: validInput.contractId,
        contributorWallet: TEST_WALLET_2,
        contributionPct: 50,
      }),
    );
  });

  it('sends notification to added contributor via after()', async () => {
    await actions.addContributorAction(validInput);
    await flushAfterCallbacks();
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userWallet: TEST_WALLET_2,
        type: 'contributor_added',
      }),
    );
  });

  it('skips notification when adding self', async () => {
    await actions.addContributorAction({
      ...validInput,
      contributorWallet: TEST_WALLET,
    });
    await flushAfterCallbacks();
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it('rejects invalid wallet address', async () => {
    await expect(
      actions.addContributorAction({
        ...validInput,
        contributorWallet: 'not-an-address',
      }),
    ).rejects.toThrow();
  });

  it('rejects contribution pct > 100', async () => {
    await expect(
      actions.addContributorAction({ ...validInput, contributionPct: 101 }),
    ).rejects.toThrow();
  });

  it('rejects contribution pct < 0', async () => {
    await expect(
      actions.addContributorAction({ ...validInput, contributionPct: -1 }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// updateContributorFieldsAction
// ===========================================================================

describe('updateContributorFieldsAction', () => {
  const validInput = {
    contractId: '550e8400-e29b-41d4-a716-446655440000',
    contributorId: '660e8400-e29b-41d4-a716-446655440001',
    contributionPct: 60,
  };

  beforeEach(() => {
    mockUpdateContributorFields.mockResolvedValue({
      id: 'cc-1',
      contributionPct: 60,
    });
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.updateContributorFieldsAction(validInput),
    ).rejects.toThrow('Unauthorized');
  });

  it('checks ownership', async () => {
    await actions.updateContributorFieldsAction(validInput);
    expect(mockRequireContractOwner).toHaveBeenCalledWith(
      validInput.contractId,
      TEST_WALLET,
    );
  });

  it('delegates to updateContributorFields', async () => {
    await actions.updateContributorFieldsAction(validInput);
    expect(mockUpdateContributorFields).toHaveBeenCalledWith(
      validInput.contractId,
      validInput.contributorId,
      expect.objectContaining({ contributionPct: 60 }),
    );
  });

  it('throws when contributor not found', async () => {
    mockUpdateContributorFields.mockResolvedValue(null);
    await expect(
      actions.updateContributorFieldsAction(validInput),
    ).rejects.toThrow('Contributor not found');
  });
});

// ===========================================================================
// removeContributorAction
// ===========================================================================

describe('removeContributorAction', () => {
  beforeEach(() => {
    mockRemoveContributor.mockResolvedValue({ id: 'cc-1' });
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(actions.removeContributorAction('c1', 'cc-1')).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('checks ownership', async () => {
    await actions.removeContributorAction('c1', 'cc-1');
    expect(mockRequireContractOwner).toHaveBeenCalledWith('c1', TEST_WALLET);
  });

  it('delegates to removeContributor', async () => {
    await actions.removeContributorAction('c1', 'cc-1');
    expect(mockRemoveContributor).toHaveBeenCalledWith('c1', 'cc-1');
  });

  it('throws when contributor not found', async () => {
    mockRemoveContributor.mockResolvedValue(null);
    await expect(actions.removeContributorAction('c1', 'cc-1')).rejects.toThrow(
      'Contributor not found',
    );
  });

  it('returns ok on success', async () => {
    const result = await actions.removeContributorAction('c1', 'cc-1');
    expect(result).toEqual({ ok: true });
  });
});

// ===========================================================================
// resetSignaturesAction
// ===========================================================================

describe('resetSignaturesAction', () => {
  beforeEach(() => {
    mockResetContractSignatures.mockResolvedValue({
      id: 'c1',
      status: 'pending_signatures',
    });
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(actions.resetSignaturesAction('c1')).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('checks ownership', async () => {
    await actions.resetSignaturesAction('c1');
    expect(mockRequireContractOwner).toHaveBeenCalledWith('c1', TEST_WALLET);
  });

  it('delegates to resetContractSignatures', async () => {
    await actions.resetSignaturesAction('c1');
    expect(mockResetContractSignatures).toHaveBeenCalledWith('c1');
  });

  it('throws when reset fails', async () => {
    mockResetContractSignatures.mockResolvedValue(null);
    await expect(actions.resetSignaturesAction('c1')).rejects.toThrow(
      'Reset failed',
    );
  });
});

// ===========================================================================
// generateInviteLinkAction
// ===========================================================================

describe('generateInviteLinkAction', () => {
  beforeEach(() => {
    mockGenerateInviteToken.mockResolvedValue({
      token: 'tok-123',
      expiresAt: '2025-02-01',
    });
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.generateInviteLinkAction('c1', 'cc-1'),
    ).rejects.toThrow('Unauthorized');
  });

  it('checks ownership', async () => {
    await actions.generateInviteLinkAction('c1', 'cc-1');
    expect(mockRequireContractOwner).toHaveBeenCalledWith('c1', TEST_WALLET);
  });

  it('returns invite link with token', async () => {
    const result = await actions.generateInviteLinkAction('c1', 'cc-1');
    expect(result.inviteLink).toContain('/invite/tok-123');
    expect(result.expiresAt).toBe('2025-02-01');
  });

  it('throws when token generation fails', async () => {
    mockGenerateInviteToken.mockResolvedValue(null);
    await expect(
      actions.generateInviteLinkAction('c1', 'cc-1'),
    ).rejects.toThrow('Contributor not found');
  });

  it('uses NEXT_PUBLIC_APP_DOMAIN for base URL', async () => {
    const original = process.env.NEXT_PUBLIC_APP_DOMAIN;
    process.env.NEXT_PUBLIC_APP_DOMAIN = 'https://axiom.app';
    const result = await actions.generateInviteLinkAction('c1', 'cc-1');
    expect(result.inviteLink).toBe('https://axiom.app/invite/tok-123');
    process.env.NEXT_PUBLIC_APP_DOMAIN = original;
  });
});

// ===========================================================================
// signContractAction
// ===========================================================================

describe('signContractAction', () => {
  const validInput = {
    contractId: '550e8400-e29b-41d4-a716-446655440000',
    contributorWallet: TEST_WALLET,
    signature: '0x' + 'a'.repeat(130),
    contractHash: 'hash123',
  };

  beforeEach(() => {
    mockVerifyMessage.mockResolvedValue(true);
    mockSignContributor.mockResolvedValue({ id: 'cc-1', status: 'signed' });
    mockGetContractById.mockResolvedValue({
      id: validInput.contractId,
      status: 'pending_signatures',
      paperTitle: 'Test Paper',
      contractHash: 'hash123',
      creator: { walletAddress: '0xOTHER' },
      contributors: [
        {
          contributorWallet: TEST_WALLET,
          contributorName: 'Me',
          status: 'signed',
        },
        {
          contributorWallet: TEST_WALLET_2,
          contributorName: 'Bob',
          status: 'pending',
        },
      ],
    });
    mockCreateContractSchedule.mockResolvedValue(null);
  });

  it('requires authentication', async () => {
    resetAuthMocksUnauthenticated();
    await expect(actions.signContractAction(validInput)).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('throws when session wallet does not match contributor wallet', async () => {
    await expect(
      actions.signContractAction({
        ...validInput,
        contributorWallet: TEST_WALLET_2,
      }),
    ).rejects.toThrow('Session wallet does not match');
  });

  it('verifies signature via viem', async () => {
    await actions.signContractAction(validInput);
    expect(mockVerifyMessage).toHaveBeenCalledWith({
      address: TEST_WALLET,
      message: 'hash123',
      signature: validInput.signature,
    });
  });

  it('throws on invalid signature', async () => {
    mockVerifyMessage.mockResolvedValue(false);
    await expect(actions.signContractAction(validInput)).rejects.toThrow(
      'Invalid signature',
    );
  });

  it('throws when verifyMessage throws', async () => {
    mockVerifyMessage.mockRejectedValue(new Error('bad sig'));
    await expect(actions.signContractAction(validInput)).rejects.toThrow(
      'Invalid signature',
    );
  });

  it('delegates to signContributor', async () => {
    await actions.signContractAction(validInput);
    expect(mockSignContributor).toHaveBeenCalledWith({
      contractId: validInput.contractId,
      contributorWallet: TEST_WALLET,
      signature: validInput.signature,
      contractHash: 'hash123',
    });
  });

  it('throws when signContributor returns null', async () => {
    mockSignContributor.mockResolvedValue(null);
    await expect(actions.signContractAction(validInput)).rejects.toThrow(
      'Contributor not found or wallet mismatch',
    );
  });

  it('returns isFullySigned=false when not fully signed', async () => {
    const result = await actions.signContractAction(validInput);
    expect(result.isFullySigned).toBe(false);
  });

  it('returns isFullySigned=true when fully signed', async () => {
    mockGetContractById.mockResolvedValue({
      id: validInput.contractId,
      status: 'fully_signed',
      paperTitle: 'Test',
      contractHash: 'hash123',
      creator: { walletAddress: '0xOTHER' },
      contributors: [
        {
          contributorWallet: TEST_WALLET,
          contributorName: 'Me',
          status: 'signed',
        },
      ],
    });
    const result = await actions.signContractAction(validInput);
    expect(result.isFullySigned).toBe(true);
  });

  it('sends fully_signed notification to all contributors via after()', async () => {
    mockGetContractById.mockResolvedValue({
      id: validInput.contractId,
      status: 'fully_signed',
      paperTitle: 'Test Paper',
      contractHash: 'hash123',
      creator: { walletAddress: '0xOTHER' },
      contributors: [
        {
          contributorWallet: TEST_WALLET,
          contributorName: 'Me',
          status: 'signed',
        },
        {
          contributorWallet: TEST_WALLET_2,
          contributorName: 'Bob',
          status: 'signed',
        },
      ],
    });

    await actions.signContractAction(validInput);
    await flushAfterCallbacks();

    // Should send to each contributor
    expect(mockCreateNotification).toHaveBeenCalledTimes(2);
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'contract_fully_signed',
        title: 'Authorship contract fully signed',
      }),
    );
  });

  it('sends partial-sign notification to contract owner via after()', async () => {
    mockGetContractById.mockResolvedValue({
      id: validInput.contractId,
      status: 'pending_signatures',
      paperTitle: 'Test Paper',
      contractHash: 'hash123',
      creator: { walletAddress: '0xOWNER' },
      contributors: [
        {
          contributorWallet: TEST_WALLET,
          contributorName: 'Me',
          status: 'signed',
        },
        {
          contributorWallet: '0xOWNER',
          contributorName: 'Owner',
          status: 'pending',
        },
      ],
    });

    await actions.signContractAction(validInput);
    await flushAfterCallbacks();

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userWallet: '0xOWNER',
        type: 'contract_signed',
        title: 'Co-author signed contract',
      }),
    );
  });

  it('skips owner notification when signer IS the owner', async () => {
    mockGetContractById.mockResolvedValue({
      id: validInput.contractId,
      status: 'pending_signatures',
      paperTitle: 'Test',
      contractHash: 'h',
      creator: { walletAddress: TEST_WALLET },
      contributors: [
        {
          contributorWallet: TEST_WALLET,
          contributorName: 'Me',
          status: 'signed',
        },
      ],
    });

    await actions.signContractAction(validInput);
    await flushAfterCallbacks();

    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it('rejects invalid signature format', async () => {
    await expect(
      actions.signContractAction({ ...validInput, signature: 'not-hex' }),
    ).rejects.toThrow();
  });

  it('rejects invalid contract UUID', async () => {
    await expect(
      actions.signContractAction({ ...validInput, contractId: 'bad' }),
    ).rejects.toThrow();
  });

  it('rejects invalid wallet address', async () => {
    await expect(
      actions.signContractAction({ ...validInput, contributorWallet: 'bad' }),
    ).rejects.toThrow();
  });
});
