'use client';

import type { CompletedReviewExtended } from '@/src/features/reviewer/types/dashboard';
import type { AuthorResponseStatusDb } from '@/src/shared/lib/db/schema';
import {
  getStatusColors,
  rebuttalResolutionLabels,
} from '@/src/shared/lib/status-colors';
import { CollapsibleSection } from '@/src/shared/components/collapsible-section.client';

const authorResponseLabels: Record<AuthorResponseStatusDb, string> = {
  pending: 'Pending',
  accepted: 'Accepted Review',
  rebuttal_requested: 'Invoked Rebuttal',
};

const authorResponseColorKeys: Record<AuthorResponseStatusDb, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rebuttal_requested: 'Rebuttal Requested',
};

interface CompletedReviewSidebarProps {
  paper: CompletedReviewExtended;
}

function AuthorResponseBadge({ status }: { status?: AuthorResponseStatusDb }) {
  const key = status ?? 'pending';
  const label = authorResponseLabels[key];
  const c = getStatusColors(authorResponseColorKeys[key]);
  return (
    <span
      className="inline-block text-[11px] px-2 py-1 rounded"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {label}
    </span>
  );
}

export function CompletedReviewSidebar({ paper }: CompletedReviewSidebarProps) {
  const rebuttalStatusColors = getStatusColors('In Progress');
  const positionColors = paper.rebuttal?.responseForThisReview
    ? getStatusColors(
        paper.rebuttal.responseForThisReview.position === 'agree'
          ? 'Agree'
          : 'Disagree',
      )
    : null;
  const resolutionColors = paper.rebuttal?.resolution
    ? getStatusColors(
        rebuttalResolutionLabels[paper.rebuttal.resolution] ?? 'Partial',
      )
    : null;

  return (
    <div className="space-y-0">
      {/* Meta info */}
      <div
        className="p-4 space-y-3"
        style={{ borderBottom: '1px solid rgba(120,110,95,0.12)' }}
      >
        <div>
          <div
            className="text-[10px] uppercase tracking-[1.5px] mb-1"
            style={{ color: '#6a6050' }}
          >
            Journal
          </div>
          <div className="text-sm font-serif" style={{ color: '#d4ccc0' }}>
            {paper.journal}
          </div>
        </div>
        <div>
          <div
            className="text-[10px] uppercase tracking-[1.5px] mb-1"
            style={{ color: '#6a6050' }}
          >
            Editor
          </div>
          <div className="text-sm" style={{ color: '#b0a898' }}>
            {paper.editorName ?? '—'}
          </div>
        </div>
        <div>
          <div
            className="text-[10px] uppercase tracking-[1.5px] mb-1"
            style={{ color: '#6a6050' }}
          >
            Submitted
          </div>
          <div className="text-sm" style={{ color: '#b0a898' }}>
            {paper.submitted}
          </div>
        </div>
      </div>

      {/* Your Review */}
      {paper.reviewContent && (
        <CollapsibleSection title="Your Review" defaultOpen>
          <div className="space-y-3">
            {paper.reviewContent.strengths && (
              <div>
                <div
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: '#6a6050' }}
                >
                  Strengths
                </div>
                <div
                  className="text-[12px] leading-relaxed"
                  style={{ color: '#b0a898' }}
                >
                  {paper.reviewContent.strengths}
                </div>
              </div>
            )}
            {paper.reviewContent.weaknesses && (
              <div>
                <div
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: '#6a6050' }}
                >
                  Weaknesses
                </div>
                <div
                  className="text-[12px] leading-relaxed"
                  style={{ color: '#b0a898' }}
                >
                  {paper.reviewContent.weaknesses}
                </div>
              </div>
            )}
            {paper.reviewContent.questionsForAuthors && (
              <div>
                <div
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: '#6a6050' }}
                >
                  Questions for Authors
                </div>
                <div
                  className="text-[12px] leading-relaxed"
                  style={{ color: '#b0a898' }}
                >
                  {paper.reviewContent.questionsForAuthors}
                </div>
              </div>
            )}
            {paper.reviewContent.recommendation && (
              <div>
                <div
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: '#6a6050' }}
                >
                  Recommendation
                </div>
                <span
                  className="inline-block text-[11px] px-2 py-1 rounded font-medium"
                  style={{
                    backgroundColor: 'rgba(201,164,74,0.15)',
                    color: '#c9a44a',
                  }}
                >
                  {paper.reviewContent.recommendation}
                </span>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Author Response */}
      <CollapsibleSection
        title="Author Response"
        defaultOpen={!!paper.rebuttal}
      >
        <div className="space-y-3">
          <AuthorResponseBadge status={paper.authorResponseStatus} />

          {paper.rebuttal && (
            <div className="space-y-3 mt-2">
              <div>
                <div
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: '#6a6050' }}
                >
                  Rebuttal Status
                </div>
                <span
                  className="inline-block text-[11px] px-2 py-1 rounded capitalize"
                  style={{
                    backgroundColor: rebuttalStatusColors.bg,
                    color: rebuttalStatusColors.text,
                  }}
                >
                  {paper.rebuttal.status}
                </span>
              </div>

              {paper.rebuttal.responseForThisReview && positionColors && (
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wider mb-1"
                    style={{ color: '#6a6050' }}
                  >
                    Author&apos;s Position
                  </div>
                  <span
                    className="inline-block text-[11px] px-2 py-1 rounded capitalize mb-2"
                    style={{
                      backgroundColor: positionColors.bg,
                      color: positionColors.text,
                    }}
                  >
                    {paper.rebuttal.responseForThisReview.position}
                  </span>
                  <div
                    className="text-[12px] leading-relaxed mt-1"
                    style={{ color: '#b0a898' }}
                  >
                    {paper.rebuttal.responseForThisReview.justification}
                  </div>
                </div>
              )}

              {paper.rebuttal.resolution && resolutionColors && (
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wider mb-1"
                    style={{ color: '#6a6050' }}
                  >
                    Editor Resolution
                  </div>
                  <span
                    className="inline-block text-[11px] px-2 py-1 rounded capitalize"
                    style={{
                      backgroundColor: resolutionColors.bg,
                      color: resolutionColors.text,
                    }}
                  >
                    {paper.rebuttal.resolution}
                  </span>
                  {paper.rebuttal.editorNotes && (
                    <div
                      className="text-[12px] leading-relaxed mt-2"
                      style={{ color: '#b0a898' }}
                    >
                      {paper.rebuttal.editorNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}
