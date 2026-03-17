/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for GET /api/cron-deadlines — deadline enforcement cron.
 */

import { NextRequest } from 'next/server';
import { flushAfterCallbacks } from '../../../../tests/setup';

const mockListOverdueAssignments = jest.fn();
const mockMarkAssignmentLate = jest.fn();
const mockRecordReputation = jest.fn();
const mockCreateNotification = jest.fn();
const mockNotifyIfWallet = jest.fn();

jest.mock('@/src/features/reviews/queries', () => ({
  listOverdueAssignments: () => mockListOverdueAssignments(),
}));

jest.mock('@/src/features/reviews/mutations', () => ({
  markAssignmentLate: (...args: unknown[]) => mockMarkAssignmentLate(...args),
  recordReputation: (...args: unknown[]) => mockRecordReputation(...args),
}));

jest.mock('@/src/features/notifications/mutations', () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
  notifyIfWallet: (...args: unknown[]) => mockNotifyIfWallet(...args),
}));

jest.mock('@/src/shared/lib/routes', () => ({
  ROUTES: {
    reviewer: { root: '/reviewer' },
    editor: { underReview: '/editor/under-review' },
  },
}));

import { GET } from './route';

const makeOverdueAssignment = (overrides: Record<string, unknown> = {}) => ({
  id: 'assign-1',
  submissionId: 'sub-1',
  reviewerWallet: '0xreviewer',
  timelineEnforcerIndex: null,
  submission: {
    paper: { title: 'Overdue Paper' },
    journal: { editorWallet: '0xeditor' },
  },
  ...overrides,
});

function makeReq(secret?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (secret) headers['authorization'] = `Bearer ${secret}`;
  return new NextRequest('http://localhost:3000/api/cron-deadlines', {
    headers,
  });
}

const REAL_ENV = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...REAL_ENV, CRON_SECRET: 'test-secret' };
  mockListOverdueAssignments.mockResolvedValue([]);
  mockMarkAssignmentLate.mockResolvedValue(undefined);
  mockRecordReputation.mockResolvedValue(undefined);
  mockCreateNotification.mockResolvedValue(undefined);
  mockNotifyIfWallet.mockResolvedValue(undefined);
});

afterAll(() => {
  process.env = REAL_ENV;
});

describe('GET /api/cron-deadlines', () => {
  it('returns 401 when Authorization header missing', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('returns 401 when CRON_SECRET not set', async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(makeReq('any-token'));
    expect(res.status).toBe(401);
  });

  it('returns 401 when bearer token does not match', async () => {
    const res = await GET(makeReq('wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with processed:0 when no overdue', async () => {
    const res = await GET(makeReq('test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(0);
  });

  it('calls markAssignmentLate for each overdue', async () => {
    mockListOverdueAssignments.mockResolvedValue([
      makeOverdueAssignment({ id: 'a1' }),
      makeOverdueAssignment({ id: 'a2' }),
    ]);
    const res = await GET(makeReq('test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(2);
    expect(mockMarkAssignmentLate).toHaveBeenCalledWith('a1');
    expect(mockMarkAssignmentLate).toHaveBeenCalledWith('a2');
  });

  it('after(): recordReputation with review_late and delta -2', async () => {
    mockListOverdueAssignments.mockResolvedValue([makeOverdueAssignment()]);
    await GET(makeReq('test-secret'));
    await flushAfterCallbacks();

    expect(mockRecordReputation).toHaveBeenCalledWith(
      '0xreviewer',
      'review_late',
      -2,
      expect.stringContaining('sub-1'),
      expect.objectContaining({
        type: 'review_late',
        assignmentId: 'assign-1',
      }),
    );
  });

  it('after(): sends notifications to reviewer and editor', async () => {
    mockListOverdueAssignments.mockResolvedValue([makeOverdueAssignment()]);
    await GET(makeReq('test-secret'));
    await flushAfterCallbacks();

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userWallet: '0xreviewer',
        type: 'review_late',
      }),
    );
    expect(mockNotifyIfWallet).toHaveBeenCalledWith(
      '0xeditor',
      expect.objectContaining({ type: 'review_late' }),
    );
  });

  it('after(): skips penalty when contract says not overdue', async () => {
    const {
      checkDeadline,
    } = require('@/src/shared/lib/hedera/timeline-enforcer');
    checkDeadline.mockResolvedValue({ isOverdue: false });

    mockListOverdueAssignments.mockResolvedValue([
      makeOverdueAssignment({ timelineEnforcerIndex: 0 }),
    ]);
    await GET(makeReq('test-secret'));
    await flushAfterCallbacks();

    expect(mockRecordReputation).not.toHaveBeenCalled();
  });

  it('after(): applies penalty when timelineEnforcerIndex is null', async () => {
    mockListOverdueAssignments.mockResolvedValue([
      makeOverdueAssignment({ timelineEnforcerIndex: null }),
    ]);
    await GET(makeReq('test-secret'));
    await flushAfterCallbacks();

    expect(mockRecordReputation).toHaveBeenCalledWith(
      '0xreviewer',
      'review_late',
      -2,
      expect.any(String),
      expect.any(Object),
    );
  });
});
