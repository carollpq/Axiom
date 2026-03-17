import {
  norm,
  computeReputationScore,
  type AggregatedEvent,
  TIMELINESS_TYPES,
  EDITOR_TYPES,
  AUTHOR_TYPES,
  PUBLICATION_TYPES,
} from './mutations';

describe('norm', () => {
  it('returns 50 when count is 0 (no data)', () => {
    expect(norm(0, 0)).toBe(50);
  });

  it('returns 50 for neutral delta (sum=0, count>0)', () => {
    expect(norm(0, 5)).toBe(50);
  });

  it('returns 100 for maximum positive (delta=+1 each)', () => {
    expect(norm(5, 5)).toBe(100);
  });

  it('returns 0 for maximum negative (delta=-1 each)', () => {
    expect(norm(-5, 5)).toBe(0);
  });

  it('clamps to 0 for extreme negative', () => {
    expect(norm(-100, 1)).toBe(0);
  });

  it('clamps to 100 for extreme positive', () => {
    expect(norm(100, 1)).toBe(100);
  });

  it('handles fractional averages', () => {
    // sum=3, count=4 → avg=0.75 → 0.75*50+50 = 87.5 → rounds to 88
    expect(norm(3, 4)).toBe(88);
  });

  it('handles small negative deltas', () => {
    // sum=-1, count=5 → avg=-0.2 → -0.2*50+50 = 40
    expect(norm(-1, 5)).toBe(40);
  });
});

describe('computeReputationScore', () => {
  it('returns default 50s with empty aggregated data', () => {
    const result = computeReputationScore([]);
    expect(result.overallScore).toBe(50);
    expect(result.timeliness).toBe(50);
    expect(result.editor).toBe(50);
    expect(result.author).toBe(50);
    expect(result.publication).toBe(50);
    expect(result.reviewCount).toBe(0);
  });

  it('counts review_completed events as reviewCount', () => {
    const events: AggregatedEvent[] = [
      { eventType: 'review_completed', sumDelta: 5, count: 5 },
    ];
    const result = computeReputationScore(events);
    expect(result.reviewCount).toBe(5);
  });

  it('does not count review_late as reviewCount', () => {
    const events: AggregatedEvent[] = [
      { eventType: 'review_late', sumDelta: -3, count: 3 },
    ];
    const result = computeReputationScore(events);
    expect(result.reviewCount).toBe(0);
  });

  it('computes weighted overall score correctly', () => {
    // All dimensions at 100 → overall = 0.3*100 + 0.25*100 + 0.25*100 + 0.2*100 = 100
    const events: AggregatedEvent[] = [
      { eventType: 'review_completed', sumDelta: 10, count: 10 },
      { eventType: 'editor_rating', sumDelta: 5, count: 5 },
      { eventType: 'author_rating', sumDelta: 5, count: 5 },
      { eventType: 'paper_published', sumDelta: 5, count: 5 },
    ];
    const result = computeReputationScore(events);
    expect(result.overallScore).toBe(100);
  });

  it('computes weighted overall with mixed scores', () => {
    // timeliness=50 (neutral), editor=100, author=0, publication=50
    // overall = 0.3*50 + 0.25*100 + 0.25*0 + 0.2*50 = 15 + 25 + 0 + 10 = 50
    const events: AggregatedEvent[] = [
      { eventType: 'review_completed', sumDelta: 0, count: 3 },
      { eventType: 'editor_rating', sumDelta: 5, count: 5 },
      { eventType: 'author_rating', sumDelta: -5, count: 5 },
    ];
    const result = computeReputationScore(events);
    expect(result.timeliness).toBe(50);
    expect(result.editor).toBe(100);
    expect(result.author).toBe(0);
    expect(result.publication).toBe(50); // default, no data
    expect(result.overallScore).toBe(50);
  });

  it('handles rebuttal events in the editor dimension', () => {
    const events: AggregatedEvent[] = [
      { eventType: 'rebuttal_upheld', sumDelta: -2, count: 2 },
    ];
    const result = computeReputationScore(events);
    // editor: sum=-2, count=2, avg=-1 → norm=0
    expect(result.editor).toBe(0);
  });

  it('combines multiple timeliness event types', () => {
    const events: AggregatedEvent[] = [
      { eventType: 'review_completed', sumDelta: 5, count: 5 },
      { eventType: 'review_late', sumDelta: -2, count: 2 },
    ];
    const result = computeReputationScore(events);
    // timeliness: sum=3, count=7, avg≈0.4286, norm≈71
    expect(result.timeliness).toBe(71);
    expect(result.reviewCount).toBe(5);
  });

  it('ignores unknown event types', () => {
    const events: AggregatedEvent[] = [
      { eventType: 'unknown_event', sumDelta: 100, count: 1 },
    ];
    const result = computeReputationScore(events);
    // All dimensions default to 50
    expect(result.overallScore).toBe(50);
  });
});

describe('event type buckets', () => {
  it('TIMELINESS_TYPES includes review_completed and review_late', () => {
    expect(TIMELINESS_TYPES).toContain('review_completed');
    expect(TIMELINESS_TYPES).toContain('review_late');
  });

  it('EDITOR_TYPES includes editor_rating and rebuttal events', () => {
    expect(EDITOR_TYPES).toContain('editor_rating');
    expect(EDITOR_TYPES).toContain('rebuttal_upheld');
    expect(EDITOR_TYPES).toContain('rebuttal_overturned');
  });

  it('AUTHOR_TYPES includes author_rating', () => {
    expect(AUTHOR_TYPES).toContain('author_rating');
  });

  it('PUBLICATION_TYPES includes paper_published', () => {
    expect(PUBLICATION_TYPES).toContain('paper_published');
  });
});
