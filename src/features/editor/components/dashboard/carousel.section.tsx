import { deriveStage } from '@/src/features/editor/mappers/journal';
import { formatIsoDate } from '@/src/shared/lib/format';
import { SubmissionCarousel } from './submission-carousel.client';
import type { EditorCarouselCard } from './submission-carousel.client';
import type { DbJournalSubmission } from '@/src/features/editor/queries';

interface Props {
  subs: DbJournalSubmission[];
}

export function CarouselSection({ subs }: Props) {
  const cards: EditorCarouselCard[] = subs.map((s) => {
    const wallets = (s.reviewerWallets as string[] | null) ?? [];
    return {
      id: s.id,
      title: s.paper.title,
      authors:
        s.paper.owner?.displayName ?? s.paper.owner?.walletAddress ?? 'Unknown',
      submittedDate: s.submittedAt ? formatIsoDate(String(s.submittedAt)) : '—',
      stage: deriveStage(
        s.status,
        s.criteriaHash ?? null,
        wallets,
        s.criteriaMet ?? null,
        s.decision ?? null,
      ),
    };
  });

  return <SubmissionCarousel cards={cards} />;
}
