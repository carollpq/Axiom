/**
 * Tests for notifications/actions.ts — server actions.
 */

// Mock auth
const mockRequireSession = jest.fn();
jest.mock('@/src/shared/lib/auth/auth', () => ({
  get requireSession() {
    return mockRequireSession;
  },
}));

// Mock mutations
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();
jest.mock('@/src/features/notifications/mutations', () => ({
  get markAsRead() {
    return mockMarkAsRead;
  },
  get markAllAsRead() {
    return mockMarkAllAsRead;
  },
}));

// Mock queries
const mockListNotifications = jest.fn();
const mockCountUnread = jest.fn();
jest.mock('@/src/features/notifications/queries', () => ({
  get listNotifications() {
    return mockListNotifications;
  },
  get countUnread() {
    return mockCountUnread;
  },
}));

let actions: typeof import('./actions');

beforeAll(async () => {
  actions = await import('./actions');
});

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireSession.mockResolvedValue('0xabc');
  mockListNotifications.mockResolvedValue([{ id: 'n-1' }]);
  mockCountUnread.mockResolvedValue(3);
  mockMarkAsRead.mockResolvedValue({ id: 'n-1' });
  mockMarkAllAsRead.mockResolvedValue(undefined);
});

// ===========================================================================
// getNotificationsAction
// ===========================================================================

describe('getNotificationsAction', () => {
  it('requires authentication', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));
    await expect(actions.getNotificationsAction()).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('returns items and unreadCount in parallel', async () => {
    const result = await actions.getNotificationsAction();
    expect(result).toEqual({
      items: [{ id: 'n-1' }],
      unreadCount: 3,
    });
    expect(mockListNotifications).toHaveBeenCalledWith('0xabc');
    expect(mockCountUnread).toHaveBeenCalledWith('0xabc');
  });
});

// ===========================================================================
// markNotificationReadAction
// ===========================================================================

describe('markNotificationReadAction', () => {
  it('requires authentication', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));
    await expect(actions.markNotificationReadAction('n-1')).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('throws Not found when markAsRead returns null', async () => {
    mockMarkAsRead.mockResolvedValue(null);
    await expect(actions.markNotificationReadAction('n-1')).rejects.toThrow(
      'Not found',
    );
  });

  it('succeeds when notification found', async () => {
    mockMarkAsRead.mockResolvedValue({ id: 'n-1' });
    await expect(
      actions.markNotificationReadAction('n-1'),
    ).resolves.toBeUndefined();
    expect(mockMarkAsRead).toHaveBeenCalledWith('n-1', '0xabc');
  });
});

// ===========================================================================
// markAllNotificationsReadAction
// ===========================================================================

describe('markAllNotificationsReadAction', () => {
  it('requires authentication', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));
    await expect(actions.markAllNotificationsReadAction()).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('delegates to markAllAsRead with wallet', async () => {
    await actions.markAllNotificationsReadAction();
    expect(mockMarkAllAsRead).toHaveBeenCalledWith('0xabc');
  });
});
