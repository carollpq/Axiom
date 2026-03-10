import type { SubmissionCard } from '@/src/features/researcher/types/dashboard';
import { getStatusColors } from '@/src/shared/lib/status-colors';

interface Props {
  card: SubmissionCard;
}

export function SubmissionCardComponent({ card }: Props) {
  const colors = getStatusColors(card.status);

  return (
    <div
      className="min-w-[280px] max-w-[320px] flex-shrink-0 rounded-md p-5 flex flex-col gap-2"
      style={{
        background: 'rgba(45,42,38,0.6)',
        border: '1px solid rgba(120,110,95,0.2)',
      }}
    >
      <h3 className="text-[14px] font-serif text-[#e8e0d4] leading-tight line-clamp-2">
        {card.paperTitle}
      </h3>
      <p className="text-[11px] text-[#8a8070]">{card.journalName}</p>
      <p className="text-[11px] text-[#6a6050]">{card.authors}</p>
      <p className="text-[10px] text-[#4a4238]">
        Submitted at {card.submittedAt}
      </p>
      <div className="mt-auto pt-2">
        <span
          className="inline-block px-3 py-1 rounded text-[10px] font-medium"
          style={{
            background: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
          }}
        >
          {card.status}
        </span>
      </div>
    </div>
  );
}
