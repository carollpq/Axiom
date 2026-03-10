'use client';

import { SectionLabel } from '@/src/shared/components/section-label';
import { FormTextarea } from '@/src/shared/components/form-textarea.client';
import { Button } from '@/src/shared/components/button.client';
import { ResolutionBanner } from './resolution-banner';
import { SubmittedConfirmation } from './submitted-confirmation';
import { AgreeDisagreeToggle } from './agree-disagree-toggle.client';

interface ResponseFormPanelProps {
  rebuttalStatus: string;
  resolution?: string | null;
  editorNotes?: string | null;
  submitted: boolean;
  selectedReviewId: string | null;
  isReadOnly: boolean;
  responses: Record<string, { position?: string; justification?: string }>;
  isSubmitting: boolean;
  error: string | null;
  existingResponses?: {
    reviewId: string;
    position: string;
    justification: string;
  }[];
  onSetPosition: (reviewId: string, position: 'agree' | 'disagree') => void;
  onSetJustification: (reviewId: string, justification: string) => void;
  onSubmit: () => void;
}

export function ResponseFormPanel({
  rebuttalStatus,
  resolution,
  editorNotes,
  submitted,
  selectedReviewId,
  isReadOnly,
  responses,
  isSubmitting,
  error,
  existingResponses,
  onSetPosition,
  onSetJustification,
  onSubmit,
}: ResponseFormPanelProps) {
  return (
    <div
      className="w-[300px] shrink-0 overflow-y-auto"
      style={{
        borderLeft: '1px solid rgba(120,110,95,0.15)',
        background: 'rgba(30,28,24,0.3)',
      }}
    >
      {/* Resolution result (if resolved) */}
      {rebuttalStatus === 'resolved' && resolution && (
        <ResolutionBanner resolution={resolution} editorNotes={editorNotes} />
      )}

      {/* Submitted confirmation */}
      {(rebuttalStatus === 'submitted' || submitted) && !resolution && (
        <SubmittedConfirmation />
      )}

      {/* Response form (only when open) */}
      {selectedReviewId && !isReadOnly && (
        <div className="p-4">
          <SectionLabel className="mb-3">Your Response</SectionLabel>

          <AgreeDisagreeToggle
            value={responses[selectedReviewId]?.position}
            onChange={(pos) => onSetPosition(selectedReviewId, pos)}
          />

          <FormTextarea
            value={responses[selectedReviewId]?.justification ?? ''}
            onChange={(e) =>
              onSetJustification(selectedReviewId, e.target.value)
            }
            placeholder="Provide your justification..."
            rows={6}
            className="mb-3"
          />

          {error && (
            <div className="text-[11px] text-[#d4645a] font-serif mb-2">
              {error}
            </div>
          )}

          <Button
            variant="gold"
            fullWidth
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rebuttal'}
          </Button>
        </div>
      )}

      {/* Show existing responses (read-only view for submitted/resolved) */}
      {isReadOnly &&
        existingResponses &&
        existingResponses.length > 0 &&
        !resolution &&
        rebuttalStatus !== 'submitted' &&
        !submitted && (
          <div className="p-4">
            <SectionLabel className="mb-3">Past Deadline</SectionLabel>
            <div className="text-[12px] text-[#d4645a] font-serif">
              The rebuttal deadline has passed.
            </div>
          </div>
        )}
    </div>
  );
}
