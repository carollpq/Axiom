/**
 * Tests for GET /api/reviewer-reputation — public reputation endpoint.
 */

import { NextRequest } from 'next/server';

const mockFindFirst = jest.fn();
const mockSelectFrom = jest.fn();
const mockSelectWhere = jest.fn();
const mockSelectOrderBy = jest.fn();
const mockSelectLimit = jest.fn();

jest.mock('@/src/shared/lib/db', () => ({
  db: {
    query: {
      reputationScores: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    select: jest.fn(() => ({
      from: mockSelectFrom,
    })),
  },
}));

jest.mock('@/src/shared/lib/db/schema', () => ({
  reputationScores: { userWallet: 'userWallet' },
  reputationEvents: { userWallet: 'userWallet', createdAt: 'createdAt' },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  desc: jest.fn(),
}));

const mockGetReputationNftsForWallet = jest.fn();
jest.mock('@/src/shared/lib/hedera/mirror', () => ({
  getReputationNftsForWallet: (...args: unknown[]) =>
    mockGetReputationNftsForWallet(...args),
}));

import { GET } from './route';

beforeEach(() => {
  jest.clearAllMocks();
  mockFindFirst.mockResolvedValue({ overallScore: 75 });
  mockSelectFrom.mockReturnValue({
    where: mockSelectWhere.mockReturnValue({
      orderBy: mockSelectOrderBy.mockReturnValue({
        limit: mockSelectLimit.mockResolvedValue([{ id: 'e1' }]),
      }),
    }),
  });
  mockGetReputationNftsForWallet.mockResolvedValue({
    nfts: [{ serial_number: 1 }, { serial_number: 2 }],
  });
});

function makeReq(wallet?: string): NextRequest {
  const url = wallet
    ? `http://localhost:3000/api/reviewer-reputation?wallet=${wallet}`
    : 'http://localhost:3000/api/reviewer-reputation';
  return new NextRequest(url);
}

describe('GET /api/reviewer-reputation', () => {
  it('returns 400 when wallet param missing', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('wallet');
  });

  it('returns 200 with correct response shape', async () => {
    const res = await GET(makeReq('0xabc'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('wallet');
    expect(body).toHaveProperty('dbScore');
    expect(body).toHaveProperty('recentEvents');
    expect(body).toHaveProperty('onChain');
  });

  it('normalizes wallet to lowercase', async () => {
    const res = await GET(makeReq('0xABCDEF'));
    const body = await res.json();
    expect(body.wallet).toBe('0xabcdef');
  });

  it('onChain is null when mirror node fails (graceful degradation)', async () => {
    mockGetReputationNftsForWallet.mockRejectedValue(new Error('Mirror fail'));
    const res = await GET(makeReq('0xabc'));
    const body = await res.json();
    expect(body.onChain).toBeNull();
  });

  it('dbScore is null when no reputation row', async () => {
    mockFindFirst.mockResolvedValue(undefined);
    const res = await GET(makeReq('0xabc'));
    const body = await res.json();
    expect(body.dbScore).toBeNull();
  });

  it('onChain includes tokenCount and recentSerials', async () => {
    const res = await GET(makeReq('0xabc'));
    const body = await res.json();
    expect(body.onChain.tokenCount).toBe(2);
    expect(body.onChain.recentSerials).toEqual([1, 2]);
  });
});
