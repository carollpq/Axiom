import { SectionLabel } from '@/src/shared/components/section-label';

interface ResolutionBannerProps {
  resolution: string;
  editorNotes?: string | null;
}

export function ResolutionBanner({
  resolution,
  editorNotes,
}: ResolutionBannerProps) {
  return (
    <div
      className="p-4"
      style={{ borderBottom: '1px solid rgba(120,110,95,0.1)' }}
    >
      <SectionLabel className="mb-2">Resolution</SectionLabel>
      <div
        className="text-[13px] font-serif font-semibold mb-2"
        style={{
          color:
            resolution === 'upheld'
              ? '#8fbc8f'
              : resolution === 'rejected'
                ? '#d4645a'
                : '#c9a44a',
        }}
      >
        {resolution === 'upheld'
          ? 'Rebuttal Upheld'
          : resolution === 'rejected'
            ? 'Rebuttal Rejected'
            : 'Partially Upheld'}
      </div>
      {editorNotes && (
        <p className="text-[12px] text-[#8a8070] font-serif">{editorNotes}</p>
      )}
    </div>
  );
}
