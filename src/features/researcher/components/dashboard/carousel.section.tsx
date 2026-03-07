import { listUserPapers } from "@/src/features/papers/queries";
import { mapPapersToSubmissionCards } from "@/src/features/researcher/mappers/dashboard";
import { SubmissionCarousel } from "./SubmissionCarousel.client";

interface Props {
  papersPromise: ReturnType<typeof listUserPapers>;
}

export async function CarouselSection({ papersPromise }: Props) {
  const rawPapers = await papersPromise;
  const cards = mapPapersToSubmissionCards(rawPapers);

  return <SubmissionCarousel cards={cards} />;
}
