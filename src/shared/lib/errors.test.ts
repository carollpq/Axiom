import { getErrorMessage } from './errors';

describe('getErrorMessage', () => {
  it('extracts message from Error instances', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns fallback for non-Error values', () => {
    expect(getErrorMessage('string error')).toBe('Something went wrong');
  });

  it('returns fallback for null', () => {
    expect(getErrorMessage(null)).toBe('Something went wrong');
  });

  it('returns fallback for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Something went wrong');
  });

  it('returns fallback for numbers', () => {
    expect(getErrorMessage(42)).toBe('Something went wrong');
  });

  it('uses custom fallback message', () => {
    expect(getErrorMessage(null, 'Custom error')).toBe('Custom error');
  });

  it('extracts message from Error subclasses', () => {
    expect(getErrorMessage(new TypeError('type error'))).toBe('type error');
  });

  it('returns fallback for plain objects', () => {
    expect(getErrorMessage({ message: 'not an Error' })).toBe(
      'Something went wrong',
    );
  });
});
