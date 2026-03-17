/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for reviewer/actions.ts — Server Actions with auth + mutation delegation.
 * Follows the editor/actions.test.ts pattern.
 */

import {
  mockRequireSession,
  resetAuthMocks,
  resetAuthMocksUnauthenticated,
} from '../../../tests/mocks/auth';
import {
  TEST_WALLET,
  TEST_EDITOR_WALLET,
} from '../../../tests/helpers/fixtures';
import { flushAfterCallbacks } from '../../../tests/setup';

// --- Mocks ---

const mockRespondToPoolInvite = jest.fn();

jest.mock('@/src/shared/lib/auth/auth', () => ({
  requireSession: mockRequireSession,
}));

jest.mock('@/src/features/reviewer/mutations', () => ({
  respondToPoolInvite: mockRespondToPoolInvite,
}));

const mockCreateNotification = jest.fn();
jest.mock('@/src/features/notifications/mutations', () => ({
  createNotification: mockCreateNotification,
}));

// Mock db for the inline invite lookup + journal lookup in after()
const mockDbSelectFrom = jest.fn();
const mockDbSelectWhere = jest.fn();
const mockDbSelectLimit = jest.fn();

jest.mock('@/src/shared/lib/db', () => ({
  db: {
    select: jest.fn(() => ({
      from: mockDbSelectFrom,
    })),
  },
}));

jest.mock('@/src/shared/lib/db/schema', () => ({
  journalReviewers: { id: 'id', reviewerWallet: 'reviewerWallet' },
  journals: { id: 'id', name: 'name', editorWallet: 'editorWallet' },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
}));

jest.mock('@/src/shared/lib/routes', () => ({
  ROUTES: {
    editor: { management: '/editor/management' },
    reviewer: { root: '/reviewer' },
  },
}));

let actions: typeof import('./actions');

beforeAll(async () => {
  actions = await import('./actions');
});

// --- Shared fixtures ---

const INVITE_ROW = {
  id: 'jr-1',
  reviewerWallet: TEST_WALLET.toLowerCase(),
  journalId: 'j1',
};

/** Sets up sequenced db.select().from() calls: first returns invite, second returns journal row. */
function setupDbSequence(journalRow: Record<string, unknown> | null) {
  let callCount = 0;
  mockDbSelectFrom.mockImplementation(() => {
    callCount++;
    if (callCount <= 1) {
      return {
        where: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue([INVITE_ROW]),
        })),
      };
    }
    return {
      where: jest.fn(() => ({
        limit: jest.fn().mockResolvedValue(journalRow ? [journalRow] : []),
      })),
    };
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetAuthMocks(TEST_WALLET);
  mockRespondToPoolInvite.mockResolvedValue({ id: 'jr-1', status: 'accepted' });

  // Default: invite found
  mockDbSelectFrom.mockReturnValue({ where: mockDbSelectWhere });
  mockDbSelectWhere.mockReturnValue({ limit: mockDbSelectLimit });
  mockDbSelectLimit.mockResolvedValue([INVITE_ROW]);
});

// ===================================================================
// respondToPoolInviteAction
// ===================================================================

describe('respondToPoolInviteAction', () => {
  it('throws Unauthorized when unauthenticated', async () => {
    resetAuthMocksUnauthenticated();
    await expect(
      actions.respondToPoolInviteAction('jr-1', 'accepted'),
    ).rejects.toThrow('Unauthorized');
  });

  it('throws when invite not found', async () => {
    mockDbSelectLimit.mockResolvedValue([]);
    await expect(
      actions.respondToPoolInviteAction('jr-1', 'accepted'),
    ).rejects.toThrow('Pool invite not found or access denied');
  });

  it('ownership guard: WHERE clause filters by session wallet', async () => {
    // Verify the query includes the wallet filter — the and(eq(id), eq(wallet))
    // pattern means a mismatched wallet returns no rows → throws.
    const { eq } = require('drizzle-orm');
    await actions.respondToPoolInviteAction('jr-1', 'accepted');
    // eq should be called with the lowercased session wallet
    expect(eq).toHaveBeenCalledWith(
      'reviewerWallet',
      TEST_WALLET.toLowerCase(),
    );
  });

  it('calls respondToPoolInvite on success', async () => {
    await actions.respondToPoolInviteAction('jr-1', 'accepted');
    expect(mockRespondToPoolInvite).toHaveBeenCalledWith(
      'jr-1',
      TEST_WALLET,
      'accepted',
    );
  });

  it('sends pool_invite_accepted notification to editor via after()', async () => {
    setupDbSequence({ name: 'Nature', editorWallet: TEST_EDITOR_WALLET });

    await actions.respondToPoolInviteAction('jr-1', 'accepted');
    await flushAfterCallbacks();

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userWallet: TEST_EDITOR_WALLET,
        type: 'pool_invite_accepted',
        title: 'Reviewer joined pool',
      }),
    );
  });

  it('sends pool_invite_rejected notification on decline', async () => {
    setupDbSequence({ name: 'Nature', editorWallet: TEST_EDITOR_WALLET });

    await actions.respondToPoolInviteAction('jr-1', 'rejected');
    await flushAfterCallbacks();

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'pool_invite_rejected',
        title: 'Reviewer declined pool invite',
      }),
    );
  });

  it('notification body includes truncated wallet + journal name', async () => {
    setupDbSequence({ name: 'Science', editorWallet: TEST_EDITOR_WALLET });

    await actions.respondToPoolInviteAction('jr-1', 'accepted');
    await flushAfterCallbacks();

    const body = mockCreateNotification.mock.calls[0][0].body;
    expect(body).toContain(TEST_WALLET.slice(0, 8));
    expect(body).toContain('Science');
  });

  it('no notification when journal lookup returns empty', async () => {
    setupDbSequence(null);

    await actions.respondToPoolInviteAction('jr-1', 'accepted');
    await flushAfterCallbacks();

    expect(mockCreateNotification).not.toHaveBeenCalled();
  });
});
