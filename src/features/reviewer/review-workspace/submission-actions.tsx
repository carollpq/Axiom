interface SubmissionActionsProps {
  canSubmit: boolean;
  isDraft: boolean;
  hasUnsavedChanges: boolean;
  isSubmitting: boolean;
  submissionError: string | null;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export function SubmissionActions({
  canSubmit,
  isDraft,
  hasUnsavedChanges,
  isSubmitting,
  submissionError,
  onSaveDraft,
  onSubmit,
}: SubmissionActionsProps) {
  const disabled = !canSubmit || isSubmitting;

  return (
    <div
      className="py-5 px-1"
      style={{ borderTop: '1px solid rgba(120,110,95,0.15)' }}
    >
      {submissionError && (
        <div
          data-testid="submission-error"
          className="text-xs font-serif mb-3 px-3 py-2 rounded"
          style={{
            background: 'rgba(212,100,90,0.1)',
            color: '#d4645a',
            border: '1px solid rgba(212,100,90,0.25)',
          }}
        >
          {submissionError}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            data-testid="save-draft-btn"
            onClick={onSaveDraft}
            disabled={isSubmitting}
            className="text-sm px-5 py-2.5 rounded cursor-pointer font-serif"
            style={{
              background: 'rgba(120,110,95,0.1)',
              color: '#8a8070',
              border: '1px solid rgba(120,110,95,0.25)',
              opacity: isSubmitting ? 0.5 : 1,
            }}
          >
            Save Draft
          </button>
          {isDraft && !hasUnsavedChanges && (
            <span
              data-testid="draft-saved-indicator"
              className="text-xs italic"
              style={{ color: '#6a6050' }}
            >
              Draft saved
            </span>
          )}
          {hasUnsavedChanges && (
            <span
              data-testid="unsaved-changes-indicator"
              className="text-xs italic"
              style={{ color: '#c9a44a' }}
            >
              Unsaved changes
            </span>
          )}
        </div>

        <button
          data-testid="submit-review-btn"
          onClick={onSubmit}
          disabled={disabled}
          className="text-sm px-6 py-2.5 rounded cursor-pointer font-serif"
          style={{
            background: disabled
              ? 'rgba(120,110,95,0.08)'
              : 'rgba(201,164,74,0.2)',
            color: disabled ? '#4a4238' : '#c9a44a',
            border: disabled
              ? '1px solid rgba(120,110,95,0.15)'
              : '1px solid rgba(201,164,74,0.4)',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
}
