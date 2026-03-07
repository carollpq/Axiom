import type { SubmissionStage } from '@/src/features/editor/types';
import { stageColors } from '@/src/features/editor/constants';

interface Props {
  title: string;
  authors: string;
  submittedDate: string;
  stage: SubmissionStage;
}

export function SubmissionCard({
  title,
  authors,
  submittedDate,
  stage,
}: Props) {
  const colors = stageColors[stage];

  return (
    <div
      className="min-w-[280px] max-w-[320px] flex-shrink-0 rounded-md p-5 flex flex-col gap-2"
      style={{
        backgroundColor: 'rgba(100,90,75,0.2)',
        border: '1px solid rgba(180,160,130,0.4)',
      }}
    >
      <h3 className="text-[14px] font-serif text-[#e8e0d4] leading-tight line-clamp-2">
        {title}
      </h3>
      <p className="text-[11px] text-[#8a8070]">{authors}</p>
      <p className="text-[10px] text-[#4a4238]">Submitted {submittedDate}</p>
      <div className="mt-auto pt-2">
        <span
          className="inline-block px-3 py-1 rounded text-[10px] font-medium"
          style={{
            background: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
          }}
        >
          {stage}
        </span>
      </div>
    </div>
  );
}
