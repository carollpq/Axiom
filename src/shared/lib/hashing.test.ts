import { canonicalJson, sha256 } from './hashing';

describe('canonicalJson', () => {
  it('sorts top-level keys alphabetically', () => {
    expect(canonicalJson({ z: 1, a: 2, m: 3 })).toBe('{"a":2,"m":3,"z":1}');
  });

  it('sorts nested keys recursively', () => {
    const input = { b: { d: 1, c: 2 }, a: 0 };
    expect(canonicalJson(input)).toBe('{"a":0,"b":{"c":2,"d":1}}');
  });

  it('preserves array order', () => {
    expect(canonicalJson({ items: [3, 1, 2] })).toBe('{"items":[3,1,2]}');
  });

  it('handles null values', () => {
    expect(canonicalJson({ a: null, b: 1 })).toBe('{"a":null,"b":1}');
  });

  it('handles empty object', () => {
    expect(canonicalJson({})).toBe('{}');
  });

  it('handles deeply nested structures', () => {
    const input = { c: { b: { a: 1 } } };
    expect(canonicalJson(input)).toBe('{"c":{"b":{"a":1}}}');
  });

  it('handles arrays of objects with sorted keys', () => {
    const input = { list: [{ z: 1, a: 2 }] };
    expect(canonicalJson(input)).toBe('{"list":[{"a":2,"z":1}]}');
  });

  it('produces deterministic output regardless of key insertion order', () => {
    const a = canonicalJson({ foo: 1, bar: 2, baz: 3 });
    const b = canonicalJson({ baz: 3, foo: 1, bar: 2 });
    expect(a).toBe(b);
  });

  it('handles string values', () => {
    expect(canonicalJson({ name: 'test' })).toBe('{"name":"test"}');
  });

  it('handles boolean values', () => {
    expect(canonicalJson({ flag: true, other: false })).toBe(
      '{"flag":true,"other":false}',
    );
  });
});

describe('sha256', () => {
  it('hashes a string to a 64-char hex string', async () => {
    const result = await sha256('hello');
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces the known SHA-256 of "hello"', async () => {
    const result = await sha256('hello');
    expect(result).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });

  it('produces different hashes for different inputs', async () => {
    const a = await sha256('hello');
    const b = await sha256('world');
    expect(a).not.toBe(b);
  });

  it('produces consistent output for the same input', async () => {
    const a = await sha256('deterministic');
    const b = await sha256('deterministic');
    expect(a).toBe(b);
  });

  it('hashes an empty string', async () => {
    const result = await sha256('');
    expect(result).toMatch(/^[a-f0-9]{64}$/);
    // Known SHA-256 of empty string
    expect(result).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});
