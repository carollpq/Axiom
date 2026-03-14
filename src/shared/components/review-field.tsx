import { SectionLabel } from '@/src/shared/components/section-label';

interface ReviewFieldProps {
  label: string;
  value: string | null | undefined;
}

export function ReviewField({ label, value }: ReviewFieldProps) {
  if (!value) return null;

  return (
    <div className="mb-4">
      <SectionLabel className="mb-1">{label}</SectionLabel>
      <div
        className="text-[13px] text-[#b0a898] font-serif leading-relaxed p-3 rounded"
        style={{ background: 'rgba(45,42,38,0.4)' }}
      >
        {value}
      </div>
    </div>
  );
}
