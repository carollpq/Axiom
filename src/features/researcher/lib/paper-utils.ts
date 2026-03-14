import type { DbPaperWithRelations } from '@/src/features/papers/queries';

/** Extracts a comma-separated author string from a paper's contracts. */
export function extractAuthors(paper: DbPaperWithRelations): string {
  return (
    paper.contracts
      ?.flatMap((c) => c.contributors ?? [])
      .map((c) => c.contributorName)
      .filter(Boolean)
      .join(', ') || '\u2014'
  );
}
