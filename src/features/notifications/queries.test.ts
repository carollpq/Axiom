/**
 * Tests for notifications/queries.ts — Drizzle queries.
 */

// For count query chain
const mockCountWhere = jest.fn();
const mockCountFrom = jest.fn(() => ({ where: mockCountWhere }));
const mockCountSelect = jest.fn(() => ({ from: mockCountFrom }));

const mockFindMany = jest.fn();

jest.mock('@/src/shared/lib/db', () => ({
  db: {
    get select() {
      return mockCountSelect;
    },
    query: {
      notifications: {
        get findMany() {
          return mockFindMany;
        },
      },
    },
  },
}));

jest.mock('@/src/shared/lib/db/schema', () => ({
  notifications: {
    userWallet: 'userWallet',
    isRead: 'isRead',
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ _eq: [a, b] })),
  and: jest.fn((...args: unknown[]) => ({ _and: args })),
  count: jest.fn(() => 'count_fn'),
}));

import { listNotifications, countUnread } from './queries';

beforeEach(() => {
  jest.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCountSelect.mockReturnValue({ from: mockCountFrom });
  mockCountFrom.mockReturnValue({ where: mockCountWhere });
  mockCountWhere.mockResolvedValue([{ value: 0 }]);
});

// ===========================================================================
// listNotifications
// ===========================================================================

describe('listNotifications', () => {
  it('returns notifications ordered by createdAt desc', async () => {
    const items = [{ id: 'n-1' }, { id: 'n-2' }];
    mockFindMany.mockResolvedValue(items);
    const result = await listNotifications('0xABC');
    expect(mockFindMany).toHaveBeenCalled();
    expect(result).toEqual(items);
  });

  it('respects custom limit', async () => {
    mockFindMany.mockResolvedValue([]);
    await listNotifications('0xabc', 5);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5 }),
    );
  });

  it('defaults limit to 20', async () => {
    mockFindMany.mockResolvedValue([]);
    await listNotifications('0xabc');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20 }),
    );
  });
});

// ===========================================================================
// countUnread
// ===========================================================================

describe('countUnread', () => {
  it('returns count of unread notifications', async () => {
    mockCountWhere.mockResolvedValue([{ value: 5 }]);
    const result = await countUnread('0xABC');
    expect(result).toBe(5);
  });

  it('returns 0 when no results', async () => {
    mockCountWhere.mockResolvedValue([]);
    const result = await countUnread('0xabc');
    expect(result).toBe(0);
  });

  it('returns 0 when result value is undefined', async () => {
    mockCountWhere.mockResolvedValue([{ value: undefined }]);
    const result = await countUnread('0xabc');
    expect(result).toBe(0);
  });
});
