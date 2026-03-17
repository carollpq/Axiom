import { buildLinkedInAddUrl } from './linkedin';

describe('buildLinkedInAddUrl', () => {
  it('builds a LinkedIn add-to-profile URL', () => {
    const url = buildLinkedInAddUrl({
      badgeId: 'badge-001',
      achievementName: 'First Review Completed',
      issuedAt: '2025-06-15T12:00:00Z',
    });

    expect(url).toContain('https://www.linkedin.com/profile/add?');
    expect(url).toContain('startTask=CERTIFICATION_NAME');
    expect(url).toContain('name=First+Review+Completed');
    expect(url).toContain('organizationName=Axiom+Academic+Review');
    expect(url).toContain('issueYear=2025');
    expect(url).toContain('issueMonth=6');
    expect(url).toContain('certId=badge-001');
  });

  it('includes APP_DOMAIN in certUrl', () => {
    const url = buildLinkedInAddUrl({
      badgeId: 'badge-002',
      achievementName: 'Test Badge',
      issuedAt: '2025-01-01T00:00:00Z',
    });

    // Default APP_DOMAIN is http://localhost:3000 in test env
    expect(url).toContain('certUrl=');
    expect(url).toContain('api%2Fbadges%2Fbadge-002');
  });

  it('appends " — Axiom" to the achievement name', () => {
    const url = buildLinkedInAddUrl({
      badgeId: 'b',
      achievementName: 'My Badge',
      issuedAt: '2025-01-01T00:00:00Z',
    });

    // URLSearchParams encodes spaces as +
    expect(url).toContain('name=My+Badge');
    // Decode both + and percent-encoding
    const decoded = decodeURIComponent(url.replace(/\+/g, ' '));
    expect(decoded).toContain('name=My Badge — Axiom');
  });

  it('correctly parses month from issuedAt', () => {
    const url = buildLinkedInAddUrl({
      badgeId: 'b',
      achievementName: 'Test',
      issuedAt: '2025-12-25T00:00:00Z',
    });

    expect(url).toContain('issueYear=2025');
    expect(url).toContain('issueMonth=12');
  });
});
