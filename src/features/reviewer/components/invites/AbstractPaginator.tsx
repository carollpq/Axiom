'use client';

interface AbstractPaginatorProps {
  pages: string[];
  currentPage: number;
  onPrev: () => void;
  onNext: () => void;
}

export function AbstractPaginator({
  pages,
  currentPage,
  onPrev,
  onNext,
}: AbstractPaginatorProps) {
  if (pages.length <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        onClick={onPrev}
        disabled={currentPage === 0}
        className="px-2 py-1 rounded text-xs font-serif disabled:opacity-50 cursor-pointer disabled:cursor-default"
        style={{
          backgroundColor:
            currentPage === 0 ? 'rgba(120,110,95,0.1)' : 'rgba(201,164,74,0.3)',
          color: currentPage === 0 ? '#8a8070' : '#c9a44a',
        }}
      >
        Prev
      </button>
      <span className="text-xs font-serif" style={{ color: '#8a8070' }}>
        {currentPage + 1} / {pages.length}
      </span>
      <button
        onClick={onNext}
        disabled={currentPage === pages.length - 1}
        className="px-2 py-1 rounded text-xs font-serif disabled:opacity-50 cursor-pointer disabled:cursor-default"
        style={{
          backgroundColor:
            currentPage === pages.length - 1
              ? 'rgba(120,110,95,0.1)'
              : 'rgba(201,164,74,0.3)',
          color: currentPage === pages.length - 1 ? '#8a8070' : '#c9a44a',
        }}
      >
        Next
      </button>
    </div>
  );
}
