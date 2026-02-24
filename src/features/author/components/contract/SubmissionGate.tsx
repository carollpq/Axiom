interface SubmissionGateProps {
  allSigned: boolean;
  isValid: boolean;
  signedCount: number;
  totalContributors: number;
}

export function SubmissionGate({ allSigned, isValid, signedCount, totalContributors }: SubmissionGateProps) {
  const remaining = totalContributors - signedCount;

  return (
    <div
      className="rounded-lg p-6 text-center"
      style={{
        background: allSigned ? "rgba(120,180,120,0.06)" : "rgba(45,42,38,0.5)",
        border: "1px solid " + (allSigned ? "rgba(120,180,120,0.2)" : "rgba(120,110,95,0.2)"),
      }}
    >
      {allSigned ? (
        <div>
          <div className="text-sm text-[#8fbc8f] mb-1">{"\u2713"} Contract Fully Signed</div>
          <div className="text-[11px] text-[#6a6050] mb-4">Recorded immutably on Hedera. You may now proceed to submission.</div>
          <button
            className="py-3 px-8 rounded text-[#8fbc8f] font-serif text-sm cursor-pointer tracking-wide"
            style={{
              background: "linear-gradient(135deg, rgba(120,180,120,0.25), rgba(100,160,100,0.15))",
              border: "1px solid rgba(120,180,120,0.4)",
            }}
          >Proceed to Submission {"\u2192"}</button>
        </div>
      ) : (
        <div>
          <div className="text-[13px] text-[#6a6050] mb-2">
            {isValid
              ? `Waiting for ${remaining} more signature${remaining > 1 ? "s" : ""}`
              : "Contributions must total 100% before signatures"}
          </div>
          <button
            disabled
            className="py-3 px-8 rounded text-[#4a4238] font-serif text-sm cursor-not-allowed tracking-wide"
            style={{
              background: "rgba(120,110,95,0.1)",
              border: "1px solid rgba(120,110,95,0.15)",
            }}
          >Proceed to Submission {"\u2192"}</button>
          <div className="text-[10px] text-[#4a4238] mt-2 italic">
            All co-authors must sign before submission
          </div>
        </div>
      )}
    </div>
  );
}
