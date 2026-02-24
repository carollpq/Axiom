import type { SubmissionResult } from "@/src/shared/types/review-workspace";

interface SubmissionConfirmationProps {
  result: SubmissionResult;
}

export function SubmissionConfirmation({ result }: SubmissionConfirmationProps) {
  const { met, partial, notMet } = result.criteriaSummary;

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div
        className="rounded-lg p-8 text-center"
        style={{
          background: "linear-gradient(145deg, rgba(45,42,38,0.9), rgba(35,32,28,0.9))",
          border: "1px solid rgba(120,110,95,0.25)",
        }}
      >
        <div
          className="text-4xl mb-4"
          style={{ color: "#8fbc8f" }}
        >
          {"\u2713"}
        </div>
        <h2
          className="text-xl font-serif font-normal m-0 mb-2"
          style={{ color: "#e8e0d4" }}
        >
          Review Submitted Successfully
        </h2>
        <p className="text-sm mb-8" style={{ color: "#8a8070" }}>
          Your review has been hashed and anchored on Hedera
        </p>

        <div className="flex flex-col gap-3 text-left mb-8">
          {[
            { label: "Transaction Hash", value: result.txHash, mono: true },
            { label: "Timestamp", value: result.timestamp, mono: false },
            { label: "Paper Hash", value: result.paperHash, mono: true },
            { label: "Review Hash", value: result.reviewHash, mono: true },
          ].map(row => (
            <div
              key={row.label}
              className="flex items-center justify-between px-4 py-3 rounded"
              style={{ background: "rgba(30,28,24,0.5)" }}
            >
              <span className="text-xs" style={{ color: "#6a6050" }}>
                {row.label}
              </span>
              <span
                className="text-xs"
                style={{
                  color: "#c9b89e",
                  fontFamily: row.mono ? "monospace" : "inherit",
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Criteria Summary */}
        <div
          className="rounded-md p-5"
          style={{
            background: "rgba(30,28,24,0.5)",
            border: "1px solid rgba(120,110,95,0.1)",
          }}
        >
          <div
            className="text-xs uppercase mb-3"
            style={{ color: "#6a6050", letterSpacing: 1.5 }}
          >
            Criteria Summary
          </div>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-serif" style={{ color: "#8fbc8f" }}>
                {met}
              </div>
              <div className="text-xs" style={{ color: "#6a6050" }}>Met</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-serif" style={{ color: "#d4a45a" }}>
                {partial}
              </div>
              <div className="text-xs" style={{ color: "#6a6050" }}>Partial</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-serif" style={{ color: "#d4645a" }}>
                {notMet}
              </div>
              <div className="text-xs" style={{ color: "#6a6050" }}>Not Met</div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs italic" style={{ color: "#4a4238" }}>
          This review is now immutably recorded. The review hash can be independently verified against the on-chain record.
        </div>
      </div>
    </div>
  );
}
