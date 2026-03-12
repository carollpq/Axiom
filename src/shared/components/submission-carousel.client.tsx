'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SubmissionCard } from './submission-card';
import type { CarouselCard } from './submission-card';

interface Props {
  cards: CarouselCard[];
  title?: string;
  emptyMessage?: string;
}

const chevronStyle = {
  background: 'rgba(45,42,38,0.9)',
  border: '1px solid rgba(120,110,95,0.3)',
} as const;

const emptyStyle = {
  background: 'rgba(45,42,38,0.4)',
  border: '1px solid rgba(120,110,95,0.15)',
} as const;

const scrollContainerStyle = { scrollbarWidth: 'none' } as const;

export function SubmissionCarousel({
  cards,
  title,
  emptyMessage = 'No submissions yet.',
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  if (cards.length === 0) {
    return (
      <div
        className="rounded-md px-6 py-10 text-center text-[13px] text-[#6a6050]"
        style={emptyStyle}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h3 className="text-[14px] font-serif text-[#b0a898] mb-3 tracking-[1px]">
          {title}
        </h3>
      )}
      <div className="relative">
        {cards.length > 3 && (
          <>
            <button
              type="button"
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              style={chevronStyle}
            >
              <ChevronLeft size={16} className="text-[#b0a898]" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              style={chevronStyle}
            >
              <ChevronRight size={16} className="text-[#b0a898]" />
            </button>
          </>
        )}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
          style={scrollContainerStyle}
        >
          {cards.map((card) => (
            <SubmissionCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}
