/**
 * Tests for login/logout server actions.
 */
import {
  mockCookieStore,
  createCookiesMock,
} from '../../../../tests/mocks/cookies';
import { mockGetSession, AUTH_COOKIE_NAME } from '../../../../tests/mocks/auth';
import { mockThirdwebAuth } from '../../../../tests/mocks/thirdweb-auth';

// --- Mocks ---

jest.mock('next/headers', () => ({
  cookies: createCookiesMock(),
}));

jest.mock('@/src/shared/lib/auth/auth', () => ({
  auth: mockThirdwebAuth,
  getSession: mockGetSession,
  AUTH_COOKIE: AUTH_COOKIE_NAME,
}));

const mockGetOrCreateUser = jest.fn();
jest.mock('@/src/features/users/queries', () => ({
  getOrCreateUser: mockGetOrCreateUser,
}));

let getLoginPayload: typeof import('./actions').getLoginPayload;
let doLogin: typeof import('./actions').doLogin;
let doLogout: typeof import('./actions').doLogout;
let isLoggedIn: typeof import('./actions').isLoggedIn;
let getCurrentUser: typeof import('./actions').getCurrentUser;

beforeAll(async () => {
  const mod = await import('./actions');
  getLoginPayload = mod.getLoginPayload;
  doLogin = mod.doLogin;
  doLogout = mod.doLogout;
  isLoggedIn = mod.isLoggedIn;
  getCurrentUser = mod.getCurrentUser;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getLoginPayload', () => {
  it('calls auth.generatePayload with params', async () => {
    const params = { address: '0xABC', chainId: 1 };
    const mockPayload = { domain: 'test', address: '0xABC' };
    mockThirdwebAuth.generatePayload.mockResolvedValue(mockPayload);

    const result = await getLoginPayload(params);
    expect(mockThirdwebAuth.generatePayload).toHaveBeenCalledWith(params);
    expect(result).toBe(mockPayload);
  });
});

describe('doLogin', () => {
  it('throws on invalid payload', async () => {
    mockThirdwebAuth.verifyPayload.mockResolvedValue({ valid: false });

    await expect(
      doLogin({
        payload: {} as unknown as import('thirdweb/auth').LoginPayload,
        signature: 'sig',
      }),
    ).rejects.toThrow('Invalid login payload');
  });

  it('generates JWT and sets httpOnly cookie with correct options', async () => {
    mockThirdwebAuth.verifyPayload.mockResolvedValue({
      valid: true,
      payload: { address: '0xABC' },
    });
    mockThirdwebAuth.generateJWT.mockResolvedValue('jwt-token-123');

    await doLogin({
      payload: {} as unknown as import('thirdweb/auth').LoginPayload,
      signature: 'sig',
    });

    expect(mockThirdwebAuth.generateJWT).toHaveBeenCalledWith({
      payload: { address: '0xABC' },
    });
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      'jwt-token-123',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      }),
    );
  });

  it('sets secure cookie flag based on NODE_ENV', async () => {
    mockThirdwebAuth.verifyPayload.mockResolvedValue({
      valid: true,
      payload: { address: '0xABC' },
    });
    mockThirdwebAuth.generateJWT.mockResolvedValue('jwt-token');

    await doLogin({
      payload: {} as unknown as import('thirdweb/auth').LoginPayload,
      signature: 'sig',
    });

    // In test env, NODE_ENV !== 'production', so secure should be false
    const cookieOptions = mockCookieStore.set.mock.calls[0][2];
    expect(cookieOptions.secure).toBe(false);
  });
});

describe('doLogout', () => {
  it('deletes the AUTH_COOKIE', async () => {
    await doLogout();
    expect(mockCookieStore.delete).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
  });
});

describe('isLoggedIn', () => {
  it('returns true when session matches (case-insensitive)', async () => {
    mockGetSession.mockResolvedValue('0xabc123');
    expect(await isLoggedIn('0xABC123')).toBe(true);
  });

  it('returns false when session is null', async () => {
    mockGetSession.mockResolvedValue(null);
    expect(await isLoggedIn('0xABC123')).toBe(false);
  });

  it('returns false when session does not match', async () => {
    mockGetSession.mockResolvedValue('0xother');
    expect(await isLoggedIn('0xABC123')).toBe(false);
  });
});

describe('getCurrentUser', () => {
  it('returns null when no session', async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await getCurrentUser();
    expect(result).toBeNull();
    expect(mockGetOrCreateUser).not.toHaveBeenCalled();
  });

  it('calls getOrCreateUser when session exists', async () => {
    const mockUser = { id: '1', walletAddress: '0xabc', roles: [] };
    mockGetSession.mockResolvedValue('0xabc');
    mockGetOrCreateUser.mockResolvedValue(mockUser);

    const result = await getCurrentUser();
    expect(mockGetOrCreateUser).toHaveBeenCalledWith('0xabc');
    expect(result).toBe(mockUser);
  });
});
