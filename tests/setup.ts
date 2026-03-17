/**
 * Jest global setup — auto-mock external services so tests never hit
 * real Hedera, Pinata, Lit, or the database.
 */

// Mock Hedera SDK modules
jest.mock('@/src/shared/lib/hedera/hcs', () => ({
  anchorToHcs: jest.fn().mockResolvedValue({ txId: 'mock-tx-0.0.1234' }),
  submitHcsMessage: jest.fn().mockResolvedValue({ txId: 'mock-tx-0.0.1234' }),
}));

jest.mock('@/src/shared/lib/hedera/hts', () => ({
  mintReputationToken: jest
    .fn()
    .mockResolvedValue({ serial: '1', txId: 'mock-tx-0.0.5678' }),
}));

jest.mock('@/src/shared/lib/hedera/client', () => ({
  getHederaClient: jest.fn().mockReturnValue(null),
  isHederaConfigured: jest.fn().mockReturnValue(false),
}));

jest.mock('@/src/shared/lib/hedera/timeline-enforcer', () => ({
  registerDeadline: jest.fn().mockResolvedValue(null),
  checkDeadline: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/src/shared/lib/hedera/schedule', () => ({
  createScheduledTransaction: jest.fn().mockResolvedValue(null),
}));

// Mock next/server after() to execute immediately
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    after: (fn: () => void | Promise<void>) => {
      // Execute immediately so side effects are testable
      void fn();
    },
  };
});

// Mock Hedera network config
jest.mock('@/src/shared/lib/hedera/network', () => ({
  HEDERA_NETWORK: 'testnet',
}));
