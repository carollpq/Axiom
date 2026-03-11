import { listUserPapers } from '@/src/features/papers/queries';
import { mapPapersToSubmissionCards } from '@/src/features/researcher/lib/dashboard';
import { SubmissionCarousel } from './submission-carousel.client';

interface Props {
  papersPromise: ReturnType<typeof listUserPapers>;
}

export async function CarouselSection({ papersPromise }: Props) {
  const rawPapers = await papersPromise;
  const cards = mapPapersToSubmissionCards(rawPapers);

  return <SubmissionCarousel cards={cards} />;
}
