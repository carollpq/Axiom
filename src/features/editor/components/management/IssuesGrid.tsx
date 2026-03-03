import type { JournalIssue } from "@/src/features/editor/types";

interface IssuesGridProps {
  issues: JournalIssue[];
}

export function IssuesGrid({ issues }: IssuesGridProps) {
  return (
    <div className="mb-8">
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-4">
        Issues
      </div>
      <div className="grid grid-cols-4 gap-4">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="rounded-[6px] p-5 flex flex-col items-center justify-center cursor-pointer transition-colors"
            style={{
              background: "rgba(45,42,38,0.5)",
              border: "1px solid rgba(120,110,95,0.2)",
              minHeight: 100,
            }}
          >
            <div className="font-serif text-sm text-[#e8e0d4]">{issue.label}</div>
            <div className="text-[11px] text-[#6a6050] mt-1">
              {issue.paperCount} papers
            </div>
          </div>
        ))}

        {/* Add new issue card */}
        <div
          className="rounded-[6px] p-5 flex items-center justify-center cursor-pointer transition-colors"
          style={{
            border: "2px dashed rgba(120,110,95,0.25)",
            minHeight: 100,
          }}
        >
          <div className="text-[12px] text-[#6a6050] font-serif text-center">
            Add new issue...
          </div>
        </div>
      </div>
    </div>
  );
}
