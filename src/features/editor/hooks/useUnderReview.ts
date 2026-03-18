'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSelection } from '@/src/shared/hooks/useSelection';
import { useDecisionFlow } from './useDecisionFlow';
import { useRebuttalFlow } from './useRebuttalFlow';
import { assignReviewersAction } from '@/src/features/submissions/actions';
import { getErrorMessage } from '@/src/shared/lib/errors';
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

/** Composes useDecisionFlow + useRebuttalFlow for the under-review three-column view. */
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
  const router = useRouter();
  const [additionalAssigned, setAdditionalAssigned] = useState<string[]>([]);
  const [reviewerSearch, setReviewerSearch] = useState('');
  const [timelineDays, setTimelineDays] = useState(21);
  const [isSendingInvites, setIsSendingInvites] = useState(false);

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

  async function sendAdditionalInvites() {
    if (!selectedId || additionalAssigned.length === 0) return;
    setIsSendingInvites(true);
    try {
      const wallets = additionalAssigned
        .map((id) => initialReviewerPool.find((r) => r.id === id)?.wallet)
        .filter((w): w is string => !!w);
      if (wallets.length === 0) {
        toast.error('No valid reviewers selected');
        return;
      }
      await assignReviewersAction(selectedId, wallets, timelineDays);
      setAdditionalAssigned([]);
      setReviewerSearch('');
      toast.success('Reviewers assigned successfully');
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to assign reviewers'));
    } finally {
      setIsSendingInvites(false);
    }
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
    setTimelineDays,
    sendAdditionalInvites,
    isSendingInvites,
    decisionFlow,
    rebuttalFlow,
  };
}
