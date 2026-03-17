/**
 * Tests for upload reducer — pure functions, no mocks needed.
 */

import {
  uploadReducer,
  validateUpload,
  initialUploadState,
  type UploadState,
} from './upload';
import { PAPER_LIMITS } from '@/src/features/researcher/config/upload';

function stateWith(overrides: Partial<UploadState> = {}): UploadState {
  return { ...initialUploadState, ...overrides };
}

// ---------------------------------------------------------------------------
// Reducer action tests
// ---------------------------------------------------------------------------

describe('uploadReducer', () => {
  describe('SET_TITLE', () => {
    it('sets title', () => {
      const result = uploadReducer(initialUploadState, {
        type: 'SET_TITLE',
        title: 'My Paper',
      });
      expect(result.title).toBe('My Paper');
    });
  });

  describe('SET_ABSTRACT', () => {
    it('sets abstract', () => {
      const result = uploadReducer(initialUploadState, {
        type: 'SET_ABSTRACT',
        abstract: 'A long abstract...',
      });
      expect(result.abstract).toBe('A long abstract...');
    });
  });

  describe('FILE_UPLOAD_START', () => {
    it('sets fileName, clears fileHash, sets isHashing, clears error', () => {
      const state = stateWith({ fileHash: 'old', error: 'previous error' });
      const result = uploadReducer(state, {
        type: 'FILE_UPLOAD_START',
        fileName: 'paper.pdf',
      });
      expect(result.fileName).toBe('paper.pdf');
      expect(result.fileHash).toBe('');
      expect(result.isHashing).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('FILE_UPLOAD_COMPLETE', () => {
    it('sets fileHash and clears isHashing', () => {
      const state = stateWith({ isHashing: true });
      const result = uploadReducer(state, {
        type: 'FILE_UPLOAD_COMPLETE',
        fileHash: 'abc123',
      });
      expect(result.fileHash).toBe('abc123');
      expect(result.isHashing).toBe(false);
    });
  });

  describe('FILE_UPLOAD_ERROR', () => {
    it('clears isHashing and sets error', () => {
      const state = stateWith({ isHashing: true });
      const result = uploadReducer(state, { type: 'FILE_UPLOAD_ERROR' });
      expect(result.isHashing).toBe(false);
      expect(result.error).toBe('Failed to hash file');
    });
  });

  describe('REMOVE_FILE', () => {
    it('clears fileName and fileHash', () => {
      const state = stateWith({ fileName: 'paper.pdf', fileHash: 'abc123' });
      const result = uploadReducer(state, { type: 'REMOVE_FILE' });
      expect(result.fileName).toBe('');
      expect(result.fileHash).toBe('');
    });
  });

  describe('SET_STUDY_TYPE', () => {
    it('sets studyType', () => {
      const result = uploadReducer(initialUploadState, {
        type: 'SET_STUDY_TYPE',
        studyType: 'meta_analysis',
      });
      expect(result.studyType).toBe('meta_analysis');
    });
  });

  describe('SET_KEYWORD_INPUT', () => {
    it('sets keywordInput', () => {
      const result = uploadReducer(initialUploadState, {
        type: 'SET_KEYWORD_INPUT',
        keywordInput: 'blockchain',
      });
      expect(result.keywordInput).toBe('blockchain');
    });
  });

  describe('ADD_KEYWORD', () => {
    it('adds trimmed keyword and clears input', () => {
      const state = stateWith({
        keywordInput: '  blockchain  ',
        keywords: ['AI'],
      });
      const result = uploadReducer(state, { type: 'ADD_KEYWORD' });
      expect(result.keywords).toEqual(['AI', 'blockchain']);
      expect(result.keywordInput).toBe('');
    });

    it('rejects empty keyword', () => {
      const state = stateWith({ keywordInput: '', keywords: ['AI'] });
      const result = uploadReducer(state, { type: 'ADD_KEYWORD' });
      expect(result.keywords).toEqual(['AI']);
    });

    it('rejects whitespace-only keyword', () => {
      const state = stateWith({ keywordInput: '   ', keywords: ['AI'] });
      const result = uploadReducer(state, { type: 'ADD_KEYWORD' });
      expect(result.keywords).toEqual(['AI']);
    });

    it('enforces max keyword limit', () => {
      const keywords = Array.from(
        { length: PAPER_LIMITS.keywords.max },
        (_, i) => `kw${i}`,
      );
      const state = stateWith({ keywordInput: 'overflow', keywords });
      const result = uploadReducer(state, { type: 'ADD_KEYWORD' });
      expect(result.keywords).toHaveLength(PAPER_LIMITS.keywords.max);
      expect(result.keywords).not.toContain('overflow');
    });

    it('allows duplicate keywords (no dedup)', () => {
      const state = stateWith({ keywordInput: 'AI', keywords: ['AI'] });
      const result = uploadReducer(state, { type: 'ADD_KEYWORD' });
      expect(result.keywords).toEqual(['AI', 'AI']);
    });

    it('allows adding keyword at max - 1', () => {
      const keywords = Array.from(
        { length: PAPER_LIMITS.keywords.max - 1 },
        (_, i) => `kw${i}`,
      );
      const state = stateWith({ keywordInput: 'last', keywords });
      const result = uploadReducer(state, { type: 'ADD_KEYWORD' });
      expect(result.keywords).toHaveLength(PAPER_LIMITS.keywords.max);
      expect(result.keywords[result.keywords.length - 1]).toBe('last');
    });
  });

  describe('REMOVE_KEYWORD', () => {
    it('removes keyword at index', () => {
      const state = stateWith({ keywords: ['a', 'b', 'c'] });
      const result = uploadReducer(state, { type: 'REMOVE_KEYWORD', index: 1 });
      expect(result.keywords).toEqual(['a', 'c']);
    });

    it('handles removing first keyword', () => {
      const state = stateWith({ keywords: ['a', 'b'] });
      const result = uploadReducer(state, { type: 'REMOVE_KEYWORD', index: 0 });
      expect(result.keywords).toEqual(['b']);
    });

    it('handles removing last keyword', () => {
      const state = stateWith({ keywords: ['a', 'b'] });
      const result = uploadReducer(state, { type: 'REMOVE_KEYWORD', index: 1 });
      expect(result.keywords).toEqual(['a']);
    });
  });

  describe('REGISTER_START', () => {
    it('sets registering and clears error', () => {
      const state = stateWith({ error: 'old' });
      const result = uploadReducer(state, { type: 'REGISTER_START' });
      expect(result.registering).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('REGISTER_SUCCESS', () => {
    it('clears registering, sets registered and paperId', () => {
      const state = stateWith({ registering: true });
      const result = uploadReducer(state, {
        type: 'REGISTER_SUCCESS',
        paperId: 'paper-1',
      });
      expect(result.registering).toBe(false);
      expect(result.registered).toBe(true);
      expect(result.paperId).toBe('paper-1');
    });
  });

  describe('REGISTER_ERROR', () => {
    it('clears registering and sets error', () => {
      const state = stateWith({ registering: true });
      const result = uploadReducer(state, {
        type: 'REGISTER_ERROR',
        error: 'Network failure',
      });
      expect(result.registering).toBe(false);
      expect(result.error).toBe('Network failure');
    });
  });

  describe('RESET', () => {
    it('returns to initialUploadState', () => {
      const state = stateWith({
        title: 'Something',
        abstract: 'stuff',
        keywords: ['a', 'b'],
        registering: true,
        error: 'err',
      });
      const result = uploadReducer(state, { type: 'RESET' });
      expect(result).toEqual(initialUploadState);
    });
  });

  describe('unknown action', () => {
    it('returns state unchanged', () => {
      const result = uploadReducer(initialUploadState, {
        type: 'UNKNOWN',
      } as never);
      expect(result).toBe(initialUploadState);
    });
  });
});

// ---------------------------------------------------------------------------
// validateUpload tests
// ---------------------------------------------------------------------------

describe('validateUpload', () => {
  const validState = stateWith({
    title: 'A Valid Title',
    abstract: 'A sufficiently long abstract for testing purposes here',
    fileHash: 'abc123',
  });

  it('returns no errors for valid state', () => {
    expect(validateUpload(validState)).toEqual({});
  });

  it('requires title', () => {
    const errors = validateUpload(stateWith({ ...validState, title: '' }));
    expect(errors.title).toBe('Title is required');
  });

  it('requires title after trimming', () => {
    const errors = validateUpload(stateWith({ ...validState, title: '   ' }));
    expect(errors.title).toBe('Title is required');
  });

  it('enforces title min length', () => {
    const errors = validateUpload(stateWith({ ...validState, title: 'ab' }));
    expect(errors.title).toContain(`at least ${PAPER_LIMITS.title.min}`);
  });

  it('enforces title max length', () => {
    const longTitle = 'a'.repeat(PAPER_LIMITS.title.max + 1);
    const errors = validateUpload(
      stateWith({ ...validState, title: longTitle }),
    );
    expect(errors.title).toContain(`at most ${PAPER_LIMITS.title.max}`);
  });

  it('accepts title at exact min length', () => {
    const title = 'a'.repeat(PAPER_LIMITS.title.min);
    const errors = validateUpload(stateWith({ ...validState, title }));
    expect(errors.title).toBeUndefined();
  });

  it('accepts title at exact max length', () => {
    const title = 'a'.repeat(PAPER_LIMITS.title.max);
    const errors = validateUpload(stateWith({ ...validState, title }));
    expect(errors.title).toBeUndefined();
  });

  it('requires abstract', () => {
    const errors = validateUpload(stateWith({ ...validState, abstract: '' }));
    expect(errors.abstract).toBe('Abstract is required');
  });

  it('enforces abstract min length', () => {
    const errors = validateUpload(
      stateWith({ ...validState, abstract: 'short' }),
    );
    expect(errors.abstract).toContain(`at least ${PAPER_LIMITS.abstract.min}`);
  });

  it('enforces abstract max length', () => {
    const longAbstract = 'a'.repeat(PAPER_LIMITS.abstract.max + 1);
    const errors = validateUpload(
      stateWith({ ...validState, abstract: longAbstract }),
    );
    expect(errors.abstract).toContain(`at most ${PAPER_LIMITS.abstract.max}`);
  });

  it('requires file (fileHash)', () => {
    const errors = validateUpload(stateWith({ ...validState, fileHash: '' }));
    expect(errors.file).toBe('Please upload a PDF file');
  });

  it('reports multiple errors at once', () => {
    const errors = validateUpload(initialUploadState);
    expect(errors.title).toBeDefined();
    expect(errors.abstract).toBeDefined();
    expect(errors.file).toBeDefined();
  });
});
