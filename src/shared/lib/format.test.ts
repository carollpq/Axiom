import { truncate, getInitials, formatDate, capitalize } from './format';

describe('truncate', () => {
  it('returns short strings unchanged', () => {
    expect(truncate('0x1234')).toBe('0x1234');
  });

  it('truncates long strings with ellipsis', () => {
    expect(truncate('0x1234567890abcdef1234567890abcdef12345678')).toBe(
      '0x1234...5678',
    );
  });

  it('uses custom prefix/suffix lengths', () => {
    expect(truncate('abcdefghijklmnop', 3, 3)).toBe('abc...nop');
  });

  it('returns string unchanged if length <= prefix + suffix + 3', () => {
    expect(truncate('abcdefghijklm', 6, 4)).toBe('abcdefghijklm');
  });
});

describe('getInitials', () => {
  it('returns first two letters of wallet address (after 0x)', () => {
    expect(getInitials('0xabcdef')).toBe('AB');
  });

  it('returns initials from a name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('handles single word names', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('limits to 2 initials for long names', () => {
    expect(getInitials('John James Doe')).toBe('JJ');
  });

  it('handles extra whitespace', () => {
    expect(getInitials('  Jane   Smith  ')).toBe('JS');
  });

  it('uppercases initials', () => {
    expect(getInitials('jane smith')).toBe('JS');
  });
});

describe('formatDate', () => {
  it('returns YYYY-MM-DD for "date" format', () => {
    expect(formatDate('2025-03-15T10:30:00Z', 'date')).toBe('2025-03-15');
  });

  it('defaults to "date" format', () => {
    expect(formatDate('2025-03-15T10:30:00Z')).toBe('2025-03-15');
  });

  it('returns datetime with UTC suffix', () => {
    expect(formatDate('2025-03-15T10:30:45Z', 'datetime')).toBe(
      '2025-03-15 10:30:45 UTC',
    );
  });

  describe('relative format', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-03-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns "Today" for same day', () => {
      expect(formatDate('2025-03-15T08:00:00Z', 'relative')).toBe('Today');
    });

    it('returns "Yesterday" for 1 day ago', () => {
      expect(formatDate('2025-03-14T08:00:00Z', 'relative')).toBe('Yesterday');
    });

    it('returns "X days ago" for 2-6 days', () => {
      expect(formatDate('2025-03-12T08:00:00Z', 'relative')).toBe('3 days ago');
    });

    it('returns "1 week ago" for 7-13 days', () => {
      expect(formatDate('2025-03-07T08:00:00Z', 'relative')).toBe('1 week ago');
    });

    it('returns "X weeks ago" for 14-29 days', () => {
      expect(formatDate('2025-03-01T08:00:00Z', 'relative')).toBe(
        '2 weeks ago',
      );
    });

    it('returns "1 month ago" for 30-59 days', () => {
      expect(formatDate('2025-02-10T08:00:00Z', 'relative')).toBe(
        '1 month ago',
      );
    });

    it('returns "X months ago" for 60+ days', () => {
      expect(formatDate('2025-01-01T08:00:00Z', 'relative')).toBe(
        '2 months ago',
      );
    });
  });
});

describe('capitalize', () => {
  it('capitalizes the first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('handles already capitalized strings', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('handles single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });
});
