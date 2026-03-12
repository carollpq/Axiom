import { deriveStage } from '@/src/features/editor/lib/journal';
import { stageColors } from '@/src/features/editor/constants';
import { formatDate } from '@/src/shared/lib/format';
import { SubmissionCarousel } from '@/src/shared/components/submission-carousel.client';
import type { CarouselCard } from '@/src/shared/components/submission-card';
import type { DbJournalSubmission } from '@/src/features/editor/queries';

interface Props {
  subs: DbJournalSubmission[];
}

export function CarouselSection({ subs }: Props) {
  const cards: CarouselCard[] = subs.map((s) => {
    const wallets = (s.reviewerWallets as string[] | null) ?? [];
    const stage = deriveStage(
      s.status,
      s.criteriaHash ?? null,
      wallets,
      s.criteriaMet ?? null,
      s.decision ?? null,
    );
    const colors = stageColors[stage];

    return {
      id: s.id,
      title: s.paper.title,
      subtitle:
        s.paper.owner?.displayName ?? s.paper.owner?.walletAddress ?? 'Unknown',
      date: s.submittedAt
        ? `Submitted ${formatDate(String(s.submittedAt))}`
        : '—',
      badge: { label: stage, colors },
    };
  });

  return <SubmissionCarousel cards={cards} title="Submission Pipeline" />;
}
