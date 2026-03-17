/**
 * Tests for user mutations: registerUserRole.
 */
import { createMockDb } from '../../../tests/mocks/db';

const mockGetUserByWallet = jest.fn();

jest.mock('react', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  cache: (fn: Function) => fn,
}));

const { db, chain } = createMockDb([]);

jest.mock('@/src/shared/lib/db', () => ({ db }));
jest.mock('@/src/shared/lib/db/schema', () => ({
  users: { walletAddress: 'walletAddress' },
}));
jest.mock('drizzle-orm', () => ({
  sql: jest.fn().mockReturnValue('now()'),
  eq: jest.fn(),
}));
jest.mock('@/src/features/users/queries', () => ({
  getUserByWallet: mockGetUserByWallet,
}));

let registerUserRole: typeof import('./mutations').registerUserRole;

beforeAll(async () => {
  const mod = await import('./mutations');
  registerUserRole = mod.registerUserRole;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('registerUserRole', () => {
  it('normalizes wallet to lowercase', async () => {
    mockGetUserByWallet.mockResolvedValue(null);
    await registerUserRole('0xABC123', 'researcher', '0000-0001', 'Test');
    expect(mockGetUserByWallet).toHaveBeenCalledWith('0xabc123');
  });

  it('appends new role to existing user roles', async () => {
    mockGetUserByWallet.mockResolvedValue({
      walletAddress: '0xabc123',
      roles: ['researcher'],
    });
    await registerUserRole('0xabc123', 'editor', '0000-0001', 'Test');
    // insert should be called with roles including both
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: ['researcher', 'editor'],
      }),
    );
  });

  it('skips duplicate role', async () => {
    mockGetUserByWallet.mockResolvedValue({
      walletAddress: '0xabc123',
      roles: ['researcher'],
    });
    await registerUserRole('0xabc123', 'researcher', '0000-0001', 'Test');
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: ['researcher'],
      }),
    );
  });

  it('creates new user with single role', async () => {
    mockGetUserByWallet.mockResolvedValue(null);
    await registerUserRole('0xnew', 'reviewer', '0000-0001', 'New User');
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        walletAddress: '0xnew',
        roles: ['reviewer'],
        orcidId: '0000-0001',
        displayName: 'New User',
      }),
    );
  });

  it('passes orcidId and displayName through', async () => {
    mockGetUserByWallet.mockResolvedValue(null);
    await registerUserRole(
      '0xtest',
      'researcher',
      '0000-0002-3456',
      'Dr. Smith',
    );
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        orcidId: '0000-0002-3456',
        displayName: 'Dr. Smith',
      }),
    );
  });

  it('uses onConflictDoUpdate', async () => {
    mockGetUserByWallet.mockResolvedValue(null);
    await registerUserRole('0xtest', 'researcher', '0000-0001', 'Test');
    expect(chain.onConflictDoUpdate).toHaveBeenCalled();
  });
});
