/**
 * Tests for user DB queries: getUserByWallet, getOrCreateUser, searchUsers.
 */

// react cache: passthrough
jest.mock('react', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  cache: (fn: Function) => fn,
}));

const mockUser = {
  id: 'user-1',
  walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
  displayName: 'Test User',
  orcidId: '0000-0001-2345-6789',
  roles: ['researcher'],
};

// ---- Mutable DB mock ----
// Allows per-test control of what SELECT and INSERT return.
let selectResult: unknown[] = [mockUser];
let insertResult: unknown[] = [mockUser];

const mockReturning = jest.fn(() => Promise.resolve(insertResult));
const mockOnConflict = jest.fn(() => Promise.resolve(insertResult));
const mockValues = jest.fn(() => ({
  returning: mockReturning,
  onConflictDoUpdate: mockOnConflict,
}));
const mockLimit = jest.fn(() => Promise.resolve(selectResult));
const mockWhere = jest.fn(() => ({ limit: mockLimit }));
const mockSelectFrom = jest.fn(() => ({ where: mockWhere }));
const mockSelectFields = jest.fn(() => ({ from: mockSelectFrom }));
const mockInsert = jest.fn(() => ({ values: mockValues }));

const db = {
  select: mockSelectFields,
  insert: mockInsert,
};

jest.mock('@/src/shared/lib/db', () => ({ db }));
jest.mock('@/src/shared/lib/db/schema', () => ({
  users: {
    walletAddress: 'walletAddress',
    displayName: 'displayName',
    orcidId: 'orcidId',
    id: 'id',
  },
}));
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((col, val) => ({ col, val, op: 'eq' })),
  or: jest.fn((...args: unknown[]) => ({ op: 'or', args })),
  ilike: jest.fn((col, val) => ({ col, val, op: 'ilike' })),
}));

let getUserByWallet: typeof import('./queries').getUserByWallet;
let getOrCreateUser: typeof import('./queries').getOrCreateUser;
let searchUsers: typeof import('./queries').searchUsers;

beforeAll(async () => {
  const mod = await import('./queries');
  getUserByWallet = mod.getUserByWallet;
  getOrCreateUser = mod.getOrCreateUser;
  searchUsers = mod.searchUsers;
});

beforeEach(() => {
  jest.clearAllMocks();
  // Reset return values
  selectResult = [mockUser];
  insertResult = [mockUser];
  // Re-wire mock chains (clearAllMocks resets implementations)
  mockSelectFields.mockImplementation(() => ({ from: mockSelectFrom }));
  mockSelectFrom.mockImplementation(() => ({ where: mockWhere }));
  mockWhere.mockImplementation(() => ({ limit: mockLimit }));
  mockLimit.mockImplementation(() => Promise.resolve(selectResult));
  mockInsert.mockImplementation(() => ({ values: mockValues }));
  mockValues.mockImplementation(() => ({
    returning: mockReturning,
    onConflictDoUpdate: mockOnConflict,
  }));
  mockReturning.mockImplementation(() => Promise.resolve(insertResult));
  mockOnConflict.mockImplementation(() => Promise.resolve(insertResult));
});

describe('getUserByWallet', () => {
  it('normalizes wallet to lowercase', async () => {
    const { eq } = jest.requireMock('drizzle-orm');
    await getUserByWallet('0xABCDEF1234567890ABCDEF1234567890ABCDEF12');
    expect(eq).toHaveBeenCalledWith(
      'walletAddress',
      '0xabcdef1234567890abcdef1234567890abcdef12',
    );
  });

  it('returns user when DB returns a match', async () => {
    selectResult = [mockUser];
    const result = await getUserByWallet(
      '0xabcdef1234567890abcdef1234567890abcdef12',
    );
    expect(result).toEqual(mockUser);
  });

  it('returns null when DB returns empty array', async () => {
    selectResult = [];
    const result = await getUserByWallet('0xnotfound');
    expect(result).toBeNull();
  });

  it('calls select → from → where → limit(1)', async () => {
    await getUserByWallet('0xabc');
    expect(mockSelectFields).toHaveBeenCalled();
    expect(mockSelectFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
    expect(mockLimit).toHaveBeenCalledWith(1);
  });
});

describe('getOrCreateUser', () => {
  it('returns existing user without inserting', async () => {
    selectResult = [mockUser];
    const result = await getOrCreateUser(
      '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    );
    expect(result).toEqual(mockUser);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('inserts skeleton row when user not found', async () => {
    const newUser = {
      id: 'new-1',
      walletAddress: '0xnewwallet',
      roles: [],
      displayName: null,
      orcidId: null,
    };
    selectResult = []; // getUserByWallet returns null
    insertResult = [newUser]; // insert.returning() resolves to [newUser]

    const result = await getOrCreateUser('0xNewWallet');
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        walletAddress: '0xnewwallet',
        roles: [],
      }),
    );
    expect(result).toEqual(newUser);
  });

  it('normalizes wallet to lowercase before lookup and insert', async () => {
    const newUser = { id: 'new-2', walletAddress: '0xmixed', roles: [] };
    selectResult = [];
    insertResult = [newUser];

    await getOrCreateUser('0xMiXeD');
    const { eq } = jest.requireMock('drizzle-orm');
    expect(eq).toHaveBeenCalledWith('walletAddress', '0xmixed');
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ walletAddress: '0xmixed' }),
    );
  });
});

describe('searchUsers', () => {
  it('escapes SQL wildcards in the pattern passed to ilike', async () => {
    const { ilike } = jest.requireMock('drizzle-orm');
    await searchUsers('test%name_special');
    // ilike is called 3 times (displayName, orcidId, walletAddress)
    expect(ilike).toHaveBeenCalledTimes(3);
    expect(ilike).toHaveBeenCalledWith(
      expect.anything(),
      '%test\\%name\\_special%',
    );
  });

  it('limits results to 10', async () => {
    await searchUsers('test');
    expect(mockLimit).toHaveBeenCalledWith(10);
  });

  it('searches across displayName, orcidId, and walletAddress', async () => {
    const { ilike, or } = jest.requireMock('drizzle-orm');
    await searchUsers('query');
    expect(or).toHaveBeenCalled();
    // ilike called with each of the 3 user fields
    const ilikeCalls = ilike.mock.calls.map(
      (call: [string, string]) => call[0],
    );
    expect(ilikeCalls).toContain('displayName');
    expect(ilikeCalls).toContain('orcidId');
    expect(ilikeCalls).toContain('walletAddress');
  });
});
