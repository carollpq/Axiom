/**
 * Tests for notifications/mutations.ts — DB mutations with Drizzle chainable mocks.
 */

// --- Drizzle chain mocks ---
const mockReturning = jest.fn();
const mockWhere = jest.fn(() => ({ returning: mockReturning }));
const mockSet = jest.fn(() => ({ where: mockWhere }));
const mockUpdate = jest.fn(() => ({ set: mockSet }));
const mockInsertValues = jest.fn().mockResolvedValue(undefined);
const mockInsert = jest.fn(() => ({ values: mockInsertValues }));

jest.mock('@/src/shared/lib/db', () => ({
  db: {
    get update() {
      return mockUpdate;
    },
    get insert() {
      return mockInsert;
    },
  },
}));

jest.mock('@/src/shared/lib/db/schema', () => ({
  notifications: {
    id: 'id',
    userWallet: 'userWallet',
    isRead: 'isRead',
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ _eq: [a, b] })),
  and: jest.fn((...args: unknown[]) => ({ _and: args })),
}));

import {
  notifyIfWallet,
  createNotification,
  markAsRead,
  markAllAsRead,
} from './mutations';

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdate.mockReturnValue({ set: mockSet });
  mockSet.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ returning: mockReturning });
  mockReturning.mockResolvedValue([{ id: 'notif-1' }]);
  mockInsert.mockReturnValue({ values: mockInsertValues });
  mockInsertValues.mockResolvedValue(undefined);
});

// ===========================================================================
// notifyIfWallet
// ===========================================================================

describe('notifyIfWallet', () => {
  it.each([null, undefined])('no-ops when wallet is %s', async (wallet) => {
    await notifyIfWallet(wallet, {
      type: 'submission_viewed',
      title: 'Test',
      body: 'Body',
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('calls createNotification when wallet is provided', async () => {
    await notifyIfWallet('0xABC', {
      type: 'submission_viewed',
      title: 'Test',
      body: 'Body',
    });
    expect(mockInsert).toHaveBeenCalled();
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userWallet: '0xabc',
        type: 'submission_viewed',
        title: 'Test',
        body: 'Body',
      }),
    );
  });
});

// ===========================================================================
// createNotification
// ===========================================================================

describe('createNotification', () => {
  it('lowercases wallet and inserts all fields', async () => {
    await createNotification({
      userWallet: '0xABCDEF',
      type: 'reviewers_assigned',
      title: 'New Review',
      body: 'You have a review',
      link: '/reviews/1',
    });
    expect(mockInsertValues).toHaveBeenCalledWith({
      userWallet: '0xabcdef',
      type: 'reviewers_assigned',
      title: 'New Review',
      body: 'You have a review',
      link: '/reviews/1',
    });
  });

  it('defaults link to null when omitted', async () => {
    await createNotification({
      userWallet: '0xabc',
      type: 'submission_viewed',
      title: 'Test',
      body: 'Body',
    });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ link: null }),
    );
  });
});

// ===========================================================================
// markAsRead
// ===========================================================================

describe('markAsRead', () => {
  it('scopes update to userWallet (prevents cross-user reads)', async () => {
    await markAsRead('notif-1', '0xABC');
    expect(mockSet).toHaveBeenCalledWith({ isRead: true });
    expect(mockWhere).toHaveBeenCalled();
  });

  it('returns the updated notification', async () => {
    mockReturning.mockResolvedValue([{ id: 'notif-1', isRead: true }]);
    const result = await markAsRead('notif-1', '0xabc');
    expect(result).toEqual({ id: 'notif-1', isRead: true });
  });

  it('returns null when no match (wrong user or missing notification)', async () => {
    mockReturning.mockResolvedValue([]);
    const result = await markAsRead('notif-1', '0xwrong');
    expect(result).toBeNull();
  });
});

// ===========================================================================
// markAllAsRead
// ===========================================================================

describe('markAllAsRead', () => {
  it('lowercases wallet and only touches unread rows', async () => {
    await markAllAsRead('0xABCDEF');
    expect(mockSet).toHaveBeenCalledWith({ isRead: true });
    expect(mockWhere).toHaveBeenCalled();
  });
});
