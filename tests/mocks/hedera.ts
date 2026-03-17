/**
 * Hedera mock factories for fine-grained test control.
 * Import these when you need to customize mock behavior per-test.
 */
import type { jest } from '@jest/globals';

export function mockMintSuccess(serial = '1', txId = 'mock-tx-0.0.5678') {
  const { mintReputationToken } = jest.requireMock(
    '@/src/shared/lib/hedera/hts',
  ) as { mintReputationToken: jest.Mock };
  mintReputationToken.mockResolvedValueOnce({ serial, txId });
  return mintReputationToken;
}

export function mockMintFailure(error = new Error('HTS mint failed')) {
  const { mintReputationToken } = jest.requireMock(
    '@/src/shared/lib/hedera/hts',
  ) as { mintReputationToken: jest.Mock };
  mintReputationToken.mockRejectedValueOnce(error);
  return mintReputationToken;
}

export function mockHcsAnchor(txId = 'mock-tx-0.0.1234') {
  const { anchorToHcs } = jest.requireMock(
    '@/src/shared/lib/hedera/hcs',
  ) as { anchorToHcs: jest.Mock };
  anchorToHcs.mockResolvedValueOnce({ txId });
  return anchorToHcs;
}
