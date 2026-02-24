interface SubmissionActionsProps {
  canSubmit: boolean;
  isDraft: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export function SubmissionActions({
  canSubmit,
  isDraft,
  onSaveDraft,
  onSubmit,
}: SubmissionActionsProps) {
  return (
    <div
      className="flex items-center justify-between py-5 px-1"
      style={{ borderTop: "1px solid rgba(120,110,95,0.15)" }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onSaveDraft}
          className="text-sm px-5 py-2.5 rounded cursor-pointer font-serif"
          style={{
            background: "rgba(120,110,95,0.1)",
            color: "#8a8070",
            border: "1px solid rgba(120,110,95,0.25)",
          }}
        >
          Save Draft
        </button>
        {isDraft && (
          <span className="text-xs italic" style={{ color: "#6a6050" }}>
            Draft saved locally
          </span>
        )}
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="text-sm px-6 py-2.5 rounded cursor-pointer font-serif"
        style={{
          background: canSubmit
            ? "rgba(201,164,74,0.2)"
            : "rgba(120,110,95,0.08)",
          color: canSubmit ? "#c9a44a" : "#4a4238",
          border: canSubmit
            ? "1px solid rgba(201,164,74,0.4)"
            : "1px solid rgba(120,110,95,0.15)",
          opacity: canSubmit ? 1 : 0.6,
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}
      >
        Submit Review
      </button>
    </div>
  );
}
