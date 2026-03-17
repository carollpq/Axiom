import { BADGE_DEFINITIONS, type ReviewerStats } from './badge-definitions';

// Extract check functions by type for targeted testing
const findBadge = (type: string) =>
  BADGE_DEFINITIONS.find((b) => b.type === type)!;

describe('BADGE_DEFINITIONS', () => {
  it('has exactly 6 badge definitions', () => {
    expect(BADGE_DEFINITIONS).toHaveLength(6);
  });

  it('has unique types', () => {
    const types = BADGE_DEFINITIONS.map((b) => b.type);
    expect(new Set(types).size).toBe(types.length);
  });

  describe('first_review', () => {
    const badge = findBadge('first_review');

    it('passes with reviewCount >= 1', () => {
      expect(
        badge.check({ reviewCount: 1, overallScore: 0, timelinessScore: 0 }),
      ).toBe(true);
      expect(
        badge.check({ reviewCount: 5, overallScore: 0, timelinessScore: 0 }),
      ).toBe(true);
    });

    it('fails with reviewCount 0', () => {
      expect(
        badge.check({ reviewCount: 0, overallScore: 0, timelinessScore: 0 }),
      ).toBe(false);
    });
  });

  describe('five_reviews', () => {
    const badge = findBadge('five_reviews');

    it('passes at exactly 5', () => {
      expect(
        badge.check({ reviewCount: 5, overallScore: 0, timelinessScore: 0 }),
      ).toBe(true);
    });

    it('fails at 4', () => {
      expect(
        badge.check({ reviewCount: 4, overallScore: 0, timelinessScore: 0 }),
      ).toBe(false);
    });
  });

  describe('ten_reviews', () => {
    const badge = findBadge('ten_reviews');

    it('passes at exactly 10', () => {
      expect(
        badge.check({ reviewCount: 10, overallScore: 0, timelinessScore: 0 }),
      ).toBe(true);
    });

    it('fails at 9', () => {
      expect(
        badge.check({ reviewCount: 9, overallScore: 0, timelinessScore: 0 }),
      ).toBe(false);
    });
  });

  describe('twentyfive_reviews', () => {
    const badge = findBadge('twentyfive_reviews');

    it('passes at exactly 25', () => {
      expect(
        badge.check({ reviewCount: 25, overallScore: 0, timelinessScore: 0 }),
      ).toBe(true);
    });

    it('fails at 24', () => {
      expect(
        badge.check({ reviewCount: 24, overallScore: 0, timelinessScore: 0 }),
      ).toBe(false);
    });
  });

  describe('high_reputation', () => {
    const badge = findBadge('high_reputation');

    it('passes at score >= 80', () => {
      expect(
        badge.check({ reviewCount: 0, overallScore: 80, timelinessScore: 0 }),
      ).toBe(true);
      expect(
        badge.check({ reviewCount: 0, overallScore: 100, timelinessScore: 0 }),
      ).toBe(true);
    });

    it('fails at score 79', () => {
      expect(
        badge.check({ reviewCount: 0, overallScore: 79, timelinessScore: 0 }),
      ).toBe(false);
    });
  });

  describe('timely_reviewer', () => {
    const badge = findBadge('timely_reviewer');

    it('passes at timeliness >= 90', () => {
      expect(
        badge.check({ reviewCount: 0, overallScore: 0, timelinessScore: 90 }),
      ).toBe(true);
      expect(
        badge.check({ reviewCount: 0, overallScore: 0, timelinessScore: 100 }),
      ).toBe(true);
    });

    it('fails at timeliness 89', () => {
      expect(
        badge.check({ reviewCount: 0, overallScore: 0, timelinessScore: 89 }),
      ).toBe(false);
    });
  });

  describe('combined scenarios', () => {
    it('reviewer with all badges qualifying stats', () => {
      const stats: ReviewerStats = {
        reviewCount: 25,
        overallScore: 85,
        timelinessScore: 95,
      };
      const earned = BADGE_DEFINITIONS.filter((b) => b.check(stats));
      expect(earned).toHaveLength(6);
    });

    it('brand new reviewer earns no badges', () => {
      const stats: ReviewerStats = {
        reviewCount: 0,
        overallScore: 50,
        timelinessScore: 50,
      };
      const earned = BADGE_DEFINITIONS.filter((b) => b.check(stats));
      expect(earned).toHaveLength(0);
    });

    it('reviewer with 1 review only earns first_review', () => {
      const stats: ReviewerStats = {
        reviewCount: 1,
        overallScore: 50,
        timelinessScore: 50,
      };
      const earned = BADGE_DEFINITIONS.filter((b) => b.check(stats));
      expect(earned).toHaveLength(1);
      expect(earned[0].type).toBe('first_review');
    });
  });
});
