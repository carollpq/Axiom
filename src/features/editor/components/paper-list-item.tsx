import { PaperListItem as SharedPaperListItem } from '@/src/shared/components/paper-list-item';
import type { PaperCardData } from '@/src/features/editor/types';

interface PaperListItemProps {
  paper: PaperCardData;
  selected: boolean;
  onClick: () => void;
}

export function PaperListItem({
  paper,
  selected,
  onClick,
}: PaperListItemProps) {
  return (
    <SharedPaperListItem
      paper={{
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        abstractSnippet: paper.abstractSnippet,
      }}
      selected={selected}
      onClick={onClick}
    />
  );
}
