import type { JournalSubmission, SubmissionStage, StageColorConfig } from "@/types/journal-dashboard";
import { StageBadge } from "./StageBadge";

interface DetailHeaderProps {
  submission: JournalSubmission;
  stageColors: Record<SubmissionStage, StageColorConfig>;
  onClose: () => void;
}

export function DetailHeader({ submission, stageColors, onClose }: DetailHeaderProps) {
  return (
    <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(120,110,95,0.15)" }}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="text-[15px] text-[#e8e0d4] leading-[1.4] mb-2">
            {submission.title}
          </div>
          <StageBadge stage={submission.stage} colors={stageColors} />
        </div>
        <button
          onClick={onClose}
          className="bg-transparent border-none text-[#6a6050] text-lg cursor-pointer p-0 leading-none"
        >
          {"\u2715"}
        </button>
      </div>
    </div>
  );
}
