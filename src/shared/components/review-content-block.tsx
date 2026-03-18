import type { ReviewCommentData } from '@/src/features/editor/types';

interface ReviewContentBlockProps {
  content: ReviewCommentData;
}

const SECTIONS: ReadonlyArray<{
  key: keyof ReviewCommentData;
  label: string;
}> = [
  { key: 'strengths', label: 'Strengths' },
  { key: 'weaknesses', label: 'Weaknesses' },
  { key: 'recommendation', label: 'Recommendation' },
];

/** Compact review content for sidebar inline display. */
export function ReviewContentBlock({ content }: ReviewContentBlockProps) {
  const hasAny = SECTIONS.some(({ key }) => content[key]);

  if (!hasAny) {
    return (
      <p className="text-[11px] text-[#6a6050] italic">
        No detailed comments available.
      </p>
    );
  }

  return (
    <>
      {SECTIONS.map(({ key, label }) =>
        content[key] ? (
          <div key={key}>
            <div className="text-[9px] text-[#6a6050] uppercase tracking-[1px] mb-0.5">
              {label}
            </div>
            <p className="text-[11px] text-[#b0a898] leading-relaxed">
              {content[key]}
            </p>
          </div>
        ) : null,
      )}
    </>
  );
}
