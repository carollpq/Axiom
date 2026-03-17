/**
 * Tests for workspace mappers — pure functions, no mocks.
 */

import {
  mapAssignmentToPaper,
  mapAssignmentToCriteria,
  type ReviewAssignmentLike,
} from './workspace';

const makeVersion = (
  overrides: Partial<
    ReviewAssignmentLike['submission']['paper']['versions'][0]
  > = {},
) => ({
  versionNumber: 1,
  paperHash: '0xpaperhash123',
  datasetHash: null,
  codeRepoUrl: null,
  codeCommitHash: null,
  envSpecHash: null,
  fileStorageKey: null,
  ...overrides,
});

const makeAssignment = (
  overrides: Partial<{
    versions: ReviewAssignmentLike['submission']['paper']['versions'];
    journal: ReviewAssignmentLike['submission']['journal'];
    reviewCriteria: ReviewAssignmentLike['submission']['reviewCriteria'];
    title: string;
    abstract: string | null;
    paperId: string;
  }> = {},
): ReviewAssignmentLike => ({
  id: 'assign-1',
  submission: {
    paper: {
      id: overrides.paperId ?? 'paper-1',
      title: overrides.title ?? 'Test Paper',
      abstract: overrides.abstract ?? 'An abstract',
      versions: overrides.versions ?? [makeVersion()],
    },
    journal:
      overrides.journal === undefined ? { name: 'Nature' } : overrides.journal,
    reviewCriteria: overrides.reviewCriteria,
  },
});

// ===================================================================
// mapAssignmentToPaper
// ===================================================================

describe('mapAssignmentToPaper', () => {
  it('passes through title, abstract, and journal', () => {
    const result = mapAssignmentToPaper(makeAssignment());
    expect(result.title).toBe('Test Paper');
    expect(result.abstract).toBe('An abstract');
    expect(result.journal).toBe('Nature');
  });

  it('sets pdfUrl from fileStorageKey', () => {
    const a = makeAssignment({
      versions: [makeVersion({ fileStorageKey: 'abc' })],
    });
    const result = mapAssignmentToPaper(a);
    expect(result.pdfUrl).toBe('/api/papers/paper-1/content?format=raw');
  });

  it('sets pdfUrl to "#" when no fileStorageKey', () => {
    const result = mapAssignmentToPaper(makeAssignment());
    expect(result.pdfUrl).toBe('#');
  });

  it('uses last version (not first) for provenance', () => {
    const a = makeAssignment({
      versions: [
        makeVersion({ versionNumber: 1, paperHash: '0xold' }),
        makeVersion({ versionNumber: 2, paperHash: '0xnew' }),
      ],
    });
    const result = mapAssignmentToPaper(a);
    expect(result.version).toBe('v2');
    expect(result.provenance[0].hash).toBe('0xnew');
  });

  it('falls back to FALLBACK_PROVENANCE when no versions', () => {
    const a = makeAssignment({ versions: [] });
    const result = mapAssignmentToPaper(a);
    expect(result.provenance).toEqual([
      { label: 'Paper Hash', hash: '—', verified: false },
    ]);
    expect(result.version).toBe('v1');
  });

  it('includes dataset provenance when datasetHash present', () => {
    const a = makeAssignment({
      versions: [makeVersion({ datasetHash: '0xdata' })],
    });
    const result = mapAssignmentToPaper(a);
    const dataset = result.provenance.find((p) => p.label === 'Dataset');
    expect(dataset).toEqual({
      label: 'Dataset',
      hash: '0xdata',
      verified: true,
    });
  });

  it('includes code repo with verified=true when codeCommitHash present', () => {
    const a = makeAssignment({
      versions: [
        makeVersion({
          codeRepoUrl: 'https://github.com/test',
          codeCommitHash: '0xcommit',
        }),
      ],
    });
    const result = mapAssignmentToPaper(a);
    const code = result.provenance.find((p) => p.label === 'Code Repository');
    expect(code?.verified).toBe(true);
    expect(code?.hash).toBe('0xcommit');
  });

  it('includes code repo with verified=false when no codeCommitHash', () => {
    const a = makeAssignment({
      versions: [
        makeVersion({
          codeRepoUrl: 'https://github.com/test',
          codeCommitHash: null,
        }),
      ],
    });
    const result = mapAssignmentToPaper(a);
    const code = result.provenance.find((p) => p.label === 'Code Repository');
    expect(code?.verified).toBe(false);
    expect(code?.hash).toBe('https://github.com/test');
  });

  it('includes envSpec provenance when envSpecHash present', () => {
    const a = makeAssignment({
      versions: [makeVersion({ envSpecHash: '0xenv' })],
    });
    const result = mapAssignmentToPaper(a);
    const env = result.provenance.find((p) => p.label === 'Environment Spec');
    expect(env).toEqual({
      label: 'Environment Spec',
      hash: '0xenv',
      verified: true,
    });
  });

  it('uses "—" for journal when null', () => {
    const a = makeAssignment({ journal: null });
    const result = mapAssignmentToPaper(a);
    expect(result.journal).toBe('—');
  });

  it('defaults abstract to empty string when null', () => {
    const a: ReviewAssignmentLike = {
      id: 'assign-1',
      submission: {
        paper: {
          id: 'paper-1',
          title: 'Null Abstract Paper',
          abstract: null,
          versions: [makeVersion()],
        },
        journal: { name: 'Nature' },
      },
    };
    const result = mapAssignmentToPaper(a);
    expect(result.abstract).toBe('');
  });
});

// ===================================================================
// mapAssignmentToCriteria
// ===================================================================

describe('mapAssignmentToCriteria', () => {
  it('parses valid criteriaJson with 1-based IDs and shared onChainHash', () => {
    const criteria = [
      {
        id: 'c1',
        label: 'Reproducibility',
        evaluationType: 'binary',
        required: true,
      },
      { id: 'c2', label: 'Clarity', evaluationType: 'binary', required: true },
    ];
    const a = makeAssignment({
      reviewCriteria: [
        { criteriaJson: JSON.stringify(criteria), criteriaHash: '0xcriteria' },
      ],
    });
    const result = mapAssignmentToCriteria(a);
    expect(result).toEqual([
      { id: 1, text: 'Reproducibility', onChainHash: '0xcriteria' },
      { id: 2, text: 'Clarity', onChainHash: '0xcriteria' },
    ]);
  });

  it('returns FALLBACK_CRITERIA when criteriaJson is null', () => {
    const a = makeAssignment({
      reviewCriteria: [{ criteriaJson: null, criteriaHash: '0x' }],
    });
    const result = mapAssignmentToCriteria(a);
    expect(result).toHaveLength(4);
    expect(result[0].text).toBe('Methodology is reproducible');
  });

  it('returns FALLBACK_CRITERIA when reviewCriteria is empty', () => {
    const a = makeAssignment({ reviewCriteria: [] });
    const result = mapAssignmentToCriteria(a);
    expect(result).toHaveLength(4);
  });

  it('returns FALLBACK_CRITERIA when reviewCriteria is undefined', () => {
    const a = makeAssignment({ reviewCriteria: undefined });
    const result = mapAssignmentToCriteria(a);
    expect(result).toHaveLength(4);
  });

  it('returns FALLBACK_CRITERIA on invalid JSON (catch path)', () => {
    const a = makeAssignment({
      reviewCriteria: [{ criteriaJson: '{invalid', criteriaHash: '0x' }],
    });
    const result = mapAssignmentToCriteria(a);
    expect(result).toHaveLength(4);
  });

  it('fallback criteria use "unpublished" sentinel (not fake hex hashes)', () => {
    const a = makeAssignment({ reviewCriteria: undefined });
    const result = mapAssignmentToCriteria(a);
    for (const c of result) {
      expect(c.onChainHash).toBe('unpublished');
    }
  });
});
