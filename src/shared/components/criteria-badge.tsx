import { getStatusColors } from '@/src/shared/lib/status-colors';

interface Props {
  rating: string | null | undefined;
}

export function CriteriaBadge({ rating }: Props) {
  const colors = getStatusColors(rating ?? 'unknown');

  return (
    <span
      className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium"
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {rating ?? '—'}
    </span>
  );
}
