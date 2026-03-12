import type { BadgeColorConfig } from '@/src/shared/types/shared';

export interface CarouselCard {
  id: string;
  title: string;
  subtitle: string;
  secondarySubtitle?: string;
  date: string;
  badge: { label: string; colors: BadgeColorConfig };
}

interface Props {
  card: CarouselCard;
}

const cardStyle = {
  background: 'rgba(45,42,38,0.6)',
  border: '1px solid rgba(120,110,95,0.2)',
} as const;

export function SubmissionCard({ card }: Props) {
  return (
    <div
      className="min-w-[280px] max-w-[320px] flex-shrink-0 rounded-md p-5 flex flex-col gap-2"
      style={cardStyle}
    >
      <h3 className="text-[14px] font-serif text-[#e8e0d4] leading-tight line-clamp-2">
        {card.title}
      </h3>
      <p className="text-[11px] text-[#8a8070]">{card.subtitle}</p>
      {card.secondarySubtitle && (
        <p className="text-[11px] text-[#6a6050]">{card.secondarySubtitle}</p>
      )}
      <p className="text-[10px] text-[#4a4238]">{card.date}</p>
      <div className="mt-auto pt-2">
        <span
          className="inline-block px-3 py-1 rounded text-[10px] font-medium"
          style={{
            background: card.badge.colors.bg,
            color: card.badge.colors.text,
            border: `1px solid ${card.badge.colors.border}`,
          }}
        >
          {card.badge.label}
        </span>
      </div>
    </div>
  );
}
