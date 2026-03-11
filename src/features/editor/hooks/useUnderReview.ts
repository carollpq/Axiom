'use client';

import { useState, useEffect } from 'react';
import { useSelection } from '@/src/shared/hooks/useSelection';
import { useDecisionFlow } from './useDecisionFlow';
import { useRebuttalFlow } from './useRebuttalFlow';
import type {
  PaperCardData,
  PoolReviewer,
  ReviewerWithStatus,
  RebuttalInfo,
} from '@/src/features/editor/types';
import type { AuthorResponseStatusDb } from '@/src/shared/lib/db/schema';

interface UseUnderReviewOptions {
  initialPapers: PaperCardData[];
  initialReviewerPool: PoolReviewer[];
  reviewStatuses: Record<string, ReviewerWithStatus[]>;
  authorResponseStatuses: Record<string, AuthorResponseStatusDb | null>;
  rebuttalsBySubmission?: Record<string, RebuttalInfo>;
}

export function useUnderReview({
  initialPapers,
  initialReviewerPool,
  reviewStatuses,
  authorResponseStatuses,
  rebuttalsBySubmission,
}: UseUnderReviewOptions) {
  const [papers, setPapers] = useState(initialPapers);
  useEffect(() => {
    setPapers(initialPapers);
  }, [initialPapers]);

  const { selectedId, setSelectedId, selected } = useSelection(papers);
  const [additionalAssigned, setAdditionalAssigned] = useState<string[]>([]);
  const [reviewerSearch, setReviewerSearch] = useState('');
  const [timelineDays] = useState(21);

  const decisionFlow = useDecisionFlow({
    selectedId,
    reviewStatuses,
    authorResponseStatuses,
    onDecisionReleased: (releasedId) => {
      setPapers((prev) => prev.filter((p) => p.id !== releasedId));
      setSelectedId(null);
    },
  });

  const rebuttalFlow = useRebuttalFlow({
    selectedId,
    rebuttalsBySubmission,
  });

  function assignReviewer(id: string) {
    setAdditionalAssigned((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function removeReviewer(id: string) {
    setAdditionalAssigned((prev) => prev.filter((r) => r !== id));
  }

  return {
    papers,
    reviewerPool: initialReviewerPool,
    selectedId,
    setSelectedId,
    selected,
    additionalAssigned,
    assignReviewer,
    removeReviewer,
    reviewerSearch,
    setReviewerSearch,
    timelineDays,
    decisionFlow,
    rebuttalFlow,
  };
}
