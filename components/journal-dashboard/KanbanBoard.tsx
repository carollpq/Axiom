import type { JournalSubmission, SubmissionStage, StageColorConfig } from "@/types/journal-dashboard";

interface KanbanBoardProps {
  submissions: JournalSubmission[];
  stages: SubmissionStage[];
  stageColors: Record<SubmissionStage, StageColorConfig>;
  selectedId: number | null;
  onSelectSubmission: (id: number) => void;
}

export function KanbanBoard({
  submissions,
  stages,
  stageColors,
  selectedId,
  onSelectSubmission,
}: KanbanBoardProps) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2">
      {stages.map((st) => {
        const c = stageColors[st];
        const items = submissions.filter((s) => s.stage === st);
        return (
          <div
            key={st}
            className="min-w-[180px] flex-1 rounded-[6px] p-2.5"
            style={{
              background: "rgba(45,42,38,0.3)",
              border: "1px solid rgba(120,110,95,0.1)",
            }}
          >
            <div className="text-[10px] uppercase tracking-[1px] mb-2.5 flex justify-between" style={{ color: c.text }}>
              <span>{st}</span>
              <span
                className="px-1.5 py-px rounded-lg text-[10px]"
                style={{ background: c.bg }}
              >
                {items.length}
              </span>
            </div>
            {items.map((s) => (
              <div
                key={s.id}
                onClick={() => onSelectSubmission(s.id)}
                className="px-3 py-2.5 mb-1.5 rounded cursor-pointer transition-all duration-200"
                style={{
                  background: selectedId === s.id ? "rgba(180,160,120,0.1)" : "rgba(30,28,24,0.6)",
                  border: "1px solid " + (selectedId === s.id ? "rgba(180,160,120,0.3)" : "rgba(120,110,95,0.1)"),
                }}
              >
                <div className="text-[11px] text-[#d4ccc0] leading-[1.4] mb-1">{s.title}</div>
                <div className="text-[10px] text-[#6a6050]">
                  {s.authors.split(",")[0]}
                  {s.authors.includes(",") ? " et al." : ""}
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-[10px] text-[#3a3530] italic p-2">No submissions</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
