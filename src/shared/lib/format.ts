export function truncate(str: string, prefixLen = 6): string {
  if (str.length <= 10) return str;
  return `${str.slice(0, prefixLen)}...${str.slice(-4)}`;
}

export function getInitials(name: string): string {
  if (name.startsWith('0x')) return name.slice(2, 4).toUpperCase();
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format an ISO date/timestamp string.
 *  - "date"      → "YYYY-MM-DD"
 *  - "datetime"  → "YYYY-MM-DD HH:MM:SS UTC"
 *  - "relative"  → "Today", "3 days ago", "2 weeks ago", etc.
 */
export function formatDate(
  iso: string,
  format: 'date' | 'datetime' | 'relative' = 'date',
): string {
  if (format === 'relative') {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return '1 month ago';
    return `${Math.floor(diffDays / 30)} months ago`;
  }
  if (format === 'datetime') {
    return iso.replace('T', ' ').slice(0, 19) + ' UTC';
  }
  return iso.slice(0, 10);
}

/** Capitalize the first letter of a string. */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
