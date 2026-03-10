'use client';

import type { CompletedReviewExtended } from '@/src/features/reviewer/types';
import type { AuthorResponseStatusDb } from '@/src/shared/lib/db/schema';
import { CollapsibleSection } from '@/src/shared/components/collapsible-section.client';

interface CompletedReviewSidebarProps {
  paper: CompletedReviewExtended;
}

function AuthorResponseBadge({ status }: { status?: AuthorResponseStatusDb }) {
  if (!status || status === 'pending') {
    return (
      <span
        className="inline-block text-[11px] px-2 py-1 rounded"
        style={{ backgroundColor: 'rgba(138,128,112,0.2)', color: '#8a8070' }}
      >
        Pending
      </span>
    );
  }
  if (status === 'accepted') {
    return (
      <span
        className="inline-block text-[11px] px-2 py-1 rounded"
        style={{ backgroundColor: 'rgba(143,188,143,0.2)', color: '#8fbc8f' }}
      >
        Accepted Review
      </span>
    );
  }
  // rebuttal_requested
  return (
    <span
      className="inline-block text-[11px] px-2 py-1 rounded"
      style={{ backgroundColor: 'rgba(201,164,74,0.2)', color: '#c9a44a' }}
    >
      Invoked Rebuttal
    </span>
  );
}

export function CompletedReviewSidebar({ paper }: CompletedReviewSidebarProps) {
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
                    backgroundColor: 'rgba(90,122,154,0.2)',
                    color: '#5a7a9a',
                  }}
                >
                  {paper.rebuttal.status}
                </span>
              </div>

              {paper.rebuttal.responseForThisReview && (
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
                      backgroundColor:
                        paper.rebuttal.responseForThisReview.position ===
                        'agree'
                          ? 'rgba(143,188,143,0.2)'
                          : 'rgba(212,100,90,0.2)',
                      color:
                        paper.rebuttal.responseForThisReview.position ===
                        'agree'
                          ? '#8fbc8f'
                          : '#d4645a',
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

              {paper.rebuttal.resolution && (
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
                      backgroundColor:
                        paper.rebuttal.resolution === 'upheld'
                          ? 'rgba(212,100,90,0.2)'
                          : paper.rebuttal.resolution === 'rejected'
                            ? 'rgba(143,188,143,0.2)'
                            : 'rgba(201,164,74,0.2)',
                      color:
                        paper.rebuttal.resolution === 'upheld'
                          ? '#d4645a'
                          : paper.rebuttal.resolution === 'rejected'
                            ? '#8fbc8f'
                            : '#c9a44a',
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
