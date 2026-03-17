/**
 * Integration test for the OpenBadges v3 credential endpoint.
 * Mocks the database layer and verifies JSON-LD structure.
 */

import { GET } from './route';

// Mock the DB module
const mockFindFirst = jest.fn();
jest.mock('@/src/shared/lib/db', () => ({
  db: {
    query: {
      badges: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
  },
}));

// Hedera network is mocked in setup.ts

const TEST_BADGE = {
  id: 'badge-test-001',
  userWallet: '0xabcdef1234567890abcdef1234567890abcdef12',
  badgeType: 'first_review',
  achievementName: 'First Review Completed',
  metadata: {
    description: 'Completed your first peer review on Axiom.',
    reviewCount: 1,
    overallScore: 55,
    timelinessScore: 70,
  },
  issuedAt: '2025-01-20T12:00:00Z',
};

function createRequest(id: string) {
  return new Request(`http://localhost:3000/api/badges/${id}`);
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/badges/[id]', () => {
  beforeEach(() => {
    mockFindFirst.mockReset();
  });

  it('returns 404 for non-existent badge', async () => {
    mockFindFirst.mockResolvedValue(null);

    const response = await GET(
      createRequest('nonexistent'),
      createParams('nonexistent'),
    );
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error).toBe('Badge not found');
  });

  it('returns valid OpenBadges v3 JSON-LD', async () => {
    mockFindFirst.mockResolvedValue(TEST_BADGE);

    const response = await GET(
      createRequest(TEST_BADGE.id),
      createParams(TEST_BADGE.id),
    );
    expect(response.status).toBe(200);

    const body = await response.json();

    // Verify JSON-LD context
    expect(body['@context']).toContain('https://www.w3.org/ns/credentials/v2');
    expect(body['@context']).toContain(
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    );

    // Verify credential types
    expect(body.type).toContain('VerifiableCredential');
    expect(body.type).toContain('OpenBadgeCredential');

    // Verify issuer
    expect(body.issuer.type).toBe('Profile');
    expect(body.issuer.name).toBe('Axiom Academic Review');

    // Verify achievement subject
    expect(body.credentialSubject.type).toBe('AchievementSubject');
    expect(body.credentialSubject.achievement.type).toBe('Achievement');
    expect(body.credentialSubject.achievement.name).toBe(
      'First Review Completed',
    );

    // Verify issuance date
    expect(body.issuanceDate).toBe('2025-01-20T12:00:00Z');
  });

  it('includes Content-Type application/ld+json header', async () => {
    mockFindFirst.mockResolvedValue(TEST_BADGE);

    const response = await GET(
      createRequest(TEST_BADGE.id),
      createParams(TEST_BADGE.id),
    );
    expect(response.headers.get('Content-Type')).toBe('application/ld+json');
  });

  it('includes cache control header', async () => {
    mockFindFirst.mockResolvedValue(TEST_BADGE);

    const response = await GET(
      createRequest(TEST_BADGE.id),
      createParams(TEST_BADGE.id),
    );
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });

  it('includes badge ID in credential id and achievement id', async () => {
    mockFindFirst.mockResolvedValue(TEST_BADGE);

    const response = await GET(
      createRequest(TEST_BADGE.id),
      createParams(TEST_BADGE.id),
    );
    const body = await response.json();

    expect(body.id).toContain(`/api/badges/${TEST_BADGE.id}`);
    expect(body.credentialSubject.achievement.id).toContain(
      `/api/badges/${TEST_BADGE.id}#achievement`,
    );
  });

  it('includes criteria narrative', async () => {
    mockFindFirst.mockResolvedValue(TEST_BADGE);

    const response = await GET(
      createRequest(TEST_BADGE.id),
      createParams(TEST_BADGE.id),
    );
    const body = await response.json();

    expect(body.credentialSubject.achievement.criteria.narrative).toContain(
      'First Review Completed',
    );
    expect(body.credentialSubject.achievement.criteria.narrative).toContain(
      'Hedera blockchain',
    );
  });

  it('includes reviewCount tag when present in metadata', async () => {
    mockFindFirst.mockResolvedValue(TEST_BADGE);

    const response = await GET(
      createRequest(TEST_BADGE.id),
      createParams(TEST_BADGE.id),
    );
    const body = await response.json();

    expect(body.credentialSubject.achievement.tag).toContain('reviewCount:1');
  });

  it('omits tag when reviewCount not in metadata', async () => {
    const badgeNoCount = {
      ...TEST_BADGE,
      metadata: { description: 'test' },
    };
    mockFindFirst.mockResolvedValue(badgeNoCount);

    const response = await GET(
      createRequest(TEST_BADGE.id),
      createParams(TEST_BADGE.id),
    );
    const body = await response.json();

    expect(body.credentialSubject.achievement.tag).toBeUndefined();
  });

  it('handles badge with null metadata', async () => {
    const badgeNullMeta = { ...TEST_BADGE, metadata: null };
    mockFindFirst.mockResolvedValue(badgeNullMeta);

    const response = await GET(
      createRequest(TEST_BADGE.id),
      createParams(TEST_BADGE.id),
    );
    expect(response.status).toBe(200);
  });
});
