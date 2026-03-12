import { listUserPapers } from '@/src/features/papers/queries';
import { mapPapersToSubmissionCards } from '@/src/features/researcher/lib/dashboard';
import { getStatusColors } from '@/src/shared/lib/status-colors';
import { SubmissionCarousel } from '@/src/shared/components/submission-carousel.client';
import type { CarouselCard } from '@/src/shared/components/submission-card';

interface Props {
  papersPromise: ReturnType<typeof listUserPapers>;
}

export async function CarouselSection({ papersPromise }: Props) {
  const rawPapers = await papersPromise;
  const submissionCards = mapPapersToSubmissionCards(rawPapers);

  const cards: CarouselCard[] = submissionCards.map((sc) => {
    const colors = getStatusColors(sc.status);
    return {
      id: sc.id,
      title: sc.paperTitle,
      subtitle: sc.journalName,
      secondarySubtitle: sc.authors,
      date: `Submitted at ${sc.submittedAt}`,
      badge: { label: sc.status, colors },
    };
  });

  return (
    <SubmissionCarousel
      cards={cards}
      title="Submission Status"
      emptyMessage="No submissions yet. Submit a paper to see it here."
    />
  );
}
