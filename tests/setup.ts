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

// Mock next/server after() — collect promises so tests can await them
const afterPromises: Promise<void>[] = [];
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    after: (fn: () => void | Promise<void>) => {
      const p = Promise.resolve().then(fn).then(() => undefined);
      afterPromises.push(p);
    },
  };
});

/** Await all pending after() callbacks. Call in tests that assert on side effects. */
export async function flushAfterCallbacks() {
  await Promise.all(afterPromises.splice(0));
}

// Settle any unflushed after() callbacks between tests to prevent leaks
afterEach(async () => {
  if (afterPromises.length > 0) {
    await Promise.allSettled(afterPromises.splice(0));
  }
});

// Mock Hedera network config
jest.mock('@/src/shared/lib/hedera/network', () => ({
  HEDERA_NETWORK: 'testnet',
}));
