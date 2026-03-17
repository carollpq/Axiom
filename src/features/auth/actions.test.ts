/**
 * Tests for updateProfileAction server action.
 */

const mockRequireSession = jest.fn();
const mockRegisterUserRole = jest.fn();

jest.mock('@/src/shared/lib/auth/auth', () => ({
  requireSession: mockRequireSession,
}));

jest.mock('@/src/features/users/mutations', () => ({
  registerUserRole: mockRegisterUserRole,
}));

// Mock global fetch for ORCID API
const mockFetch = jest.fn();
global.fetch = mockFetch;

let updateProfileAction: typeof import('./actions').updateProfileAction;

beforeAll(async () => {
  const mod = await import('./actions');
  updateProfileAction = mod.updateProfileAction;
});

beforeEach(() => {
  jest.clearAllMocks();
});

const validInput = {
  role: 'researcher',
  orcidId: '0000-0001-2345-6789',
  displayName: 'Dr. Test',
};

describe('updateProfileAction', () => {
  it('throws Unauthorized when no session', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));
    await expect(updateProfileAction(validInput)).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('throws on invalid role', async () => {
    mockRequireSession.mockResolvedValue('0xabc');
    await expect(
      updateProfileAction({ ...validInput, role: 'admin' }),
    ).rejects.toThrow('Invalid role');
  });

  it('calls ORCID public API with encoded orcidId', async () => {
    mockRequireSession.mockResolvedValue('0xabc');
    mockFetch.mockResolvedValue({ ok: true });
    mockRegisterUserRole.mockResolvedValue(undefined);

    await updateProfileAction(validInput);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://pub.orcid.org/v3.0/${encodeURIComponent(validInput.orcidId)}`,
      expect.objectContaining({
        headers: { Accept: 'application/json' },
        method: 'GET',
      }),
    );
  });

  it('throws on ORCID API failure', async () => {
    mockRequireSession.mockResolvedValue('0xabc');
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    await expect(updateProfileAction(validInput)).rejects.toThrow(
      'ORCID ID not found or invalid',
    );
  });

  it('throws on empty displayName', async () => {
    mockRequireSession.mockResolvedValue('0xabc');
    mockFetch.mockResolvedValue({ ok: true });

    await expect(
      updateProfileAction({ ...validInput, displayName: '' }),
    ).rejects.toThrow('Display name is required');
  });

  it('throws on whitespace-only displayName', async () => {
    mockRequireSession.mockResolvedValue('0xabc');
    mockFetch.mockResolvedValue({ ok: true });

    await expect(
      updateProfileAction({ ...validInput, displayName: '   ' }),
    ).rejects.toThrow('Display name is required');
  });

  it('trims displayName', async () => {
    mockRequireSession.mockResolvedValue('0xabc');
    mockFetch.mockResolvedValue({ ok: true });
    mockRegisterUserRole.mockResolvedValue(undefined);

    await updateProfileAction({ ...validInput, displayName: '  Dr. Test  ' });
    expect(mockRegisterUserRole).toHaveBeenCalledWith(
      '0xabc',
      'researcher',
      validInput.orcidId,
      'Dr. Test',
    );
  });

  it('calls registerUserRole with correct args', async () => {
    mockRequireSession.mockResolvedValue('0xwallet');
    mockFetch.mockResolvedValue({ ok: true });
    mockRegisterUserRole.mockResolvedValue(undefined);

    await updateProfileAction({
      role: 'editor',
      orcidId: '0000-0002-3456-7890',
      displayName: 'Editor Name',
    });

    expect(mockRegisterUserRole).toHaveBeenCalledWith(
      '0xwallet',
      'editor',
      '0000-0002-3456-7890',
      'Editor Name',
    );
  });

  it('returns success message', async () => {
    mockRequireSession.mockResolvedValue('0xabc');
    mockFetch.mockResolvedValue({ ok: true });
    mockRegisterUserRole.mockResolvedValue(undefined);

    const result = await updateProfileAction(validInput);
    expect(result).toEqual({ message: 'User registered successfully' });
  });
});
