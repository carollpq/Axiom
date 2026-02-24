import type { JournalSubmission } from "@/src/shared/types/journal-dashboard";

interface InfoTabProps {
  submission: JournalSubmission;
}

export function InfoTab({ submission }: InfoTabProps) {
  const fields = [
    { label: "Authors", value: submission.authors },
    { label: "Submitted", value: submission.submitted },
    { label: "Deadline", value: submission.deadline || "Not set" },
    { label: "Paper Hash", value: submission.hash, mono: true },
  ];

  return (
    <div>
      {fields.map((f) => (
        <div key={f.label} className="mb-3.5">
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-[3px]">
            {f.label}
          </div>
          <div
            className="text-[13px]"
            style={{
              color: f.mono ? "#5a7a9a" : "#d4ccc0",
              fontFamily: f.mono ? "monospace" : "inherit",
            }}
          >
            {f.value}
          </div>
        </div>
      ))}

      <div className="mt-2">
        <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-1.5">
          Contract
        </div>
        <div className="text-[11px] text-[#5a7a9a] font-mono cursor-pointer">
          View authorship contract on Hedera {"\u2197"}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-1.5">
          Provenance
        </div>
        <div className="text-[11px] text-[#6a6050] italic">
          Provenance hashes available after paper is anchored on-chain.
        </div>
      </div>
    </div>
  );
}
