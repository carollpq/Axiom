import {
  validateOrcidId,
  ORCID_REGEX,
  SHA256_REGEX,
  EVM_ADDRESS_REGEX,
  HEX_SIGNATURE_REGEX,
} from './validation';

describe('validateOrcidId', () => {
  it('accepts valid ORCID with digits only', () => {
    expect(validateOrcidId('0000-0002-1825-0097')).toBeUndefined();
  });

  it('accepts valid ORCID ending with X', () => {
    expect(validateOrcidId('0000-0001-5109-343X')).toBeUndefined();
  });

  it('rejects empty string', () => {
    expect(validateOrcidId('')).toBe('ORCID ID is required');
  });

  it('rejects whitespace-only string', () => {
    expect(validateOrcidId('   ')).toBe('ORCID ID is required');
  });

  it('allows empty when allowEmpty is true', () => {
    expect(validateOrcidId('', { allowEmpty: true })).toBeUndefined();
  });

  it('rejects wrong format — too few groups', () => {
    expect(validateOrcidId('0000-0002-1825')).toMatch(/Invalid ORCID/);
  });

  it('rejects wrong format — no dashes', () => {
    expect(validateOrcidId('0000000218250097')).toMatch(/Invalid ORCID/);
  });

  it('rejects letters in the middle', () => {
    expect(validateOrcidId('0000-00A2-1825-0097')).toMatch(/Invalid ORCID/);
  });

  it('rejects lowercase x', () => {
    expect(validateOrcidId('0000-0001-5109-343x')).toMatch(/Invalid ORCID/);
  });
});

describe('regex constants', () => {
  describe('SHA256_REGEX', () => {
    it('matches a valid SHA-256 hex string', () => {
      const hash =
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      expect(SHA256_REGEX.test(hash)).toBe(true);
    });

    it('rejects uppercase hex', () => {
      const hash =
        'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855';
      expect(SHA256_REGEX.test(hash)).toBe(false);
    });

    it('rejects short strings', () => {
      expect(SHA256_REGEX.test('e3b0c442')).toBe(false);
    });
  });

  describe('EVM_ADDRESS_REGEX', () => {
    it('matches a valid EVM address', () => {
      expect(
        EVM_ADDRESS_REGEX.test('0x1234567890abcdef1234567890ABCDEF12345678'),
      ).toBe(true);
    });

    it('rejects without 0x prefix', () => {
      expect(
        EVM_ADDRESS_REGEX.test('1234567890abcdef1234567890abcdef12345678'),
      ).toBe(false);
    });

    it('rejects wrong length', () => {
      expect(EVM_ADDRESS_REGEX.test('0x1234')).toBe(false);
    });
  });

  describe('HEX_SIGNATURE_REGEX', () => {
    it('matches a hex signature', () => {
      expect(HEX_SIGNATURE_REGEX.test('0xabcdef1234')).toBe(true);
    });

    it('rejects without 0x prefix', () => {
      expect(HEX_SIGNATURE_REGEX.test('abcdef1234')).toBe(false);
    });
  });
});
