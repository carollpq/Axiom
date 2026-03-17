/**
 * Tests for core session management: getSession, requireSession, AUTH_COOKIE.
 */
import {
  mockCookieStore,
  createCookiesMock,
} from '../../../../tests/mocks/cookies';
import {
  mockThirdwebAuth,
  clearThirdwebAuthMocks,
} from '../../../../tests/mocks/thirdweb-auth';

// --- Mocks must be declared before importing the module under test ---

jest.mock('next/headers', () => ({
  cookies: createCookiesMock(),
}));

jest.mock('thirdweb/auth', () => ({
  createAuth: () => mockThirdwebAuth,
}));

jest.mock('thirdweb/wallets', () => ({
  privateKeyToAccount: jest.fn().mockReturnValue({ address: '0xadmin' }),
}));

jest.mock('@/src/shared/lib/thirdweb', () => ({
  client: { clientId: 'test' },
}));

// react cache: passthrough
jest.mock('react', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  cache: (fn: Function) => fn,
}));

// Set env var before module loads
process.env.AUTH_PRIVATE_KEY = 'test-private-key-0x1234';

// Dynamic import so mocks are in place
let getSession: typeof import('./auth').getSession;
let requireSession: typeof import('./auth').requireSession;
let AUTH_COOKIE: string;

beforeAll(async () => {
  const mod = await import('./auth');
  getSession = mod.getSession;
  requireSession = mod.requireSession;
  AUTH_COOKIE = mod.AUTH_COOKIE;
});

beforeEach(() => {
  jest.clearAllMocks();
  clearThirdwebAuthMocks();
});

describe('AUTH_COOKIE', () => {
  it('equals tw_auth_token', () => {
    expect(AUTH_COOKIE).toBe('tw_auth_token');
  });
});

describe('getSession', () => {
  it('returns null when no cookie is set', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    expect(await getSession()).toBeNull();
  });

  it('returns null when cookie value is empty', async () => {
    mockCookieStore.get.mockReturnValue({ value: '' });
    expect(await getSession()).toBeNull();
  });

  it('returns null when JWT is invalid', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'bad-jwt' });
    mockThirdwebAuth.verifyJWT.mockResolvedValue({ valid: false });
    expect(await getSession()).toBeNull();
  });

  it('returns null when verifyJWT throws', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'bad-jwt' });
    mockThirdwebAuth.verifyJWT.mockRejectedValue(new Error('decode error'));
    expect(await getSession()).toBeNull();
  });

  it('returns null when sub is missing from parsed JWT', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'valid-jwt' });
    mockThirdwebAuth.verifyJWT.mockResolvedValue({
      valid: true,
      parsedJWT: { sub: '' },
    });
    expect(await getSession()).toBeNull();
  });

  it('returns lowercase wallet address on success', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'valid-jwt' });
    mockThirdwebAuth.verifyJWT.mockResolvedValue({
      valid: true,
      parsedJWT: { sub: '0xABCDEF1234567890abcdef1234567890ABCDEF12' },
    });
    const result = await getSession();
    expect(result).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
  });
});

describe('requireSession', () => {
  it('returns wallet when session exists', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'valid-jwt' });
    mockThirdwebAuth.verifyJWT.mockResolvedValue({
      valid: true,
      parsedJWT: { sub: '0xABC123' },
    });
    const result = await requireSession();
    expect(result).toBe('0xabc123');
  });

  it('throws Unauthorized when session is null', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    await expect(requireSession()).rejects.toThrow('Unauthorized');
  });
});
