'use client';

import { useState, useMemo } from 'react';
import { DynamicPdfViewer as PdfViewer } from '@/src/shared/components/DynamicPdfViewer';
import { AbstractPaginator } from './AbstractPaginator';
import type { AssignedReview } from '@/src/features/reviewer/types';

interface InviteCardProps {
  review: AssignedReview;
  paperAbstract?: string;
  authors?: string[];
  pdfUrl?: string;
  editorName?: string;
  onAccept?: (submissionId: string) => Promise<void>;
  onReject?: (submissionId: string) => Promise<void>;
  isLoading?: boolean;
}

const acceptStyle = {
  backgroundColor: '#8fbc8f',
  color: '#1a1816',
  fontWeight: '600',
} as const;

const rejectStyle = {
  backgroundColor: 'rgba(120,110,95,0.3)',
  color: '#d4ccc0',
} as const;

/** Split text into pages of ~charLimit characters, breaking at word boundaries. */
function splitAtWordBoundary(text: string, charLimit: number): string[] {
  if (!text) return [''];
  const pages: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= charLimit) {
      pages.push(remaining);
      break;
    }
    let breakAt = remaining.lastIndexOf(' ', charLimit);
    if (breakAt <= 0) breakAt = charLimit;
    pages.push(remaining.slice(0, breakAt));
    remaining = remaining.slice(breakAt).trimStart();
  }
  return pages;
}

export function InviteCard({
  review,
  paperAbstract = '',
  authors,
  pdfUrl,
  editorName = 'Editor',
  onAccept,
  onReject,
  isLoading = false,
}: InviteCardProps) {
  const [isResponding, setIsResponding] = useState(false);
  const [abstractPage, setAbstractPage] = useState(0);

  const abstractPages = useMemo(
    () => splitAtWordBoundary(paperAbstract, 400),
    [paperAbstract],
  );

  const handleAccept = async () => {
    if (!onAccept || isResponding || isLoading || !review.submissionId) return;
    setIsResponding(true);
    try {
      await onAccept(review.submissionId);
    } finally {
      setIsResponding(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || isResponding || isLoading || !review.submissionId) return;
    setIsResponding(true);
    try {
      await onReject(review.submissionId);
    } finally {
      setIsResponding(false);
    }
  };

  const busy = isResponding || isLoading;

  return (
    <div
      className="rounded-lg p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6"
      style={{ backgroundColor: 'rgba(45,42,38,0.6)' }}
    >
      {/* Left Column: Paper Info */}
      <div
        className="lg:col-span-3 lg:border-r lg:pr-4"
        style={{ borderColor: 'rgba(120,110,95,0.3)' }}
      >
        <div className="space-y-4">
          <h3
            className="font-serif font-bold text-sm leading-tight line-clamp-3"
            style={{ color: '#d4ccc0' }}
          >
            {review.title}
          </h3>

          {authors && authors.length > 0 && (
            <p className="text-xs font-serif" style={{ color: '#b0a898' }}>
              {authors.join(', ')}
            </p>
          )}

          <div
            className="rounded p-3 text-xs font-serif leading-relaxed"
            style={{
              backgroundColor: 'rgba(120,110,95,0.1)',
              color: '#8a8070',
              maxHeight: '180px',
              overflowY: 'auto',
            }}
          >
            {abstractPages[abstractPage] || 'No abstract available'}
          </div>

          <AbstractPaginator
            pages={abstractPages}
            currentPage={abstractPage}
            onPrev={() => setAbstractPage((p) => Math.max(0, p - 1))}
            onNext={() =>
              setAbstractPage((p) => Math.min(abstractPages.length - 1, p + 1))
            }
          />
        </div>
      </div>

      {/* Center Column: PDF Viewer */}
      <div
        className="lg:col-span-6 rounded border overflow-hidden min-h-[250px] sm:min-h-[350px] lg:min-h-[400px]"
        style={{ borderColor: 'rgba(120,110,95,0.3)' }}
      >
        {pdfUrl ? (
          <div className="h-full w-full">
            <PdfViewer fileUrl={pdfUrl} title={review.title} />
          </div>
        ) : (
          <div
            className="flex items-center justify-center h-full p-8"
            style={{ color: '#8a8070' }}
          >
            <div className="text-center">
              <p className="font-serif text-sm">PDF Viewer</p>
              <p className="font-serif text-xs mt-2">No PDF available</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Invite Info */}
      <div
        className="lg:col-span-3 rounded-lg p-4 space-y-4 min-w-0"
        style={{ backgroundColor: 'rgba(120,110,95,0.1)' }}
      >
        <p
          className="text-xs font-serif uppercase tracking-wider"
          style={{ color: '#8a8070' }}
        >
          Invite Information
        </p>

        <div className="min-w-0">
          <p
            className="text-xs font-serif uppercase tracking-wide"
            style={{ color: '#8a8070' }}
          >
            Journal Name
          </p>
          <p
            className="text-sm font-serif mt-1 break-words"
            style={{ color: '#d4ccc0' }}
          >
            {review.journal}
          </p>
        </div>

        <div className="min-w-0">
          <p
            className="text-xs font-serif uppercase tracking-wide"
            style={{ color: '#8a8070' }}
          >
            Editor
          </p>
          <p
            className="text-sm font-serif mt-1 truncate"
            style={{ color: '#d4ccc0' }}
            title={editorName}
          >
            {editorName}
          </p>
        </div>

        <div className="min-w-0">
          <p
            className="text-xs font-serif uppercase tracking-wide"
            style={{ color: '#8a8070' }}
          >
            Timeline
          </p>
          <p className="text-sm font-serif mt-1" style={{ color: '#d4ccc0' }}>
            {review.daysLeft} days
          </p>
        </div>

        <div
          style={{ height: '1px', backgroundColor: 'rgba(120,110,95,0.3)' }}
        />

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleAccept}
            disabled={busy}
            className="flex-1 px-4 py-2 rounded font-serif text-sm transition-all disabled:opacity-50 hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
            style={acceptStyle}
          >
            {busy ? '...' : 'Accept'}
          </button>
          <button
            onClick={handleReject}
            disabled={busy}
            className="flex-1 px-4 py-2 rounded font-serif text-sm transition-all disabled:opacity-50 hover:brightness-125 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
            style={rejectStyle}
          >
            {busy ? '...' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}
