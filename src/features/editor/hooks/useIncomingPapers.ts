'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSelection } from '@/src/shared/hooks/useSelection';
import {
  markViewedAction,
  assignReviewersAction,
  makeDecisionAction,
} from '@/src/features/submissions/actions';
import type { PaperCardData, PoolReviewer } from '@/src/features/editor/types';

/** Manages incoming papers: auto-marks viewed on selection, reviewer assignment, and desk reject. */
export function useIncomingPapers(
  initialPapers: PaperCardData[],
  initialReviewerPool: PoolReviewer[],
) {
  const router = useRouter();
  const [papers, setPapers] = useState(initialPapers);
  useEffect(() => {
    setPapers(initialPapers);
  }, [initialPapers]);

  const { selectedId, setSelectedId, selected } = useSelection(papers);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [reviewerSearch, setReviewerSearch] = useState('');
  const [deskRejectComment, setDeskRejectComment] = useState('');
  const [timelineDays, setTimelineDays] = useState(21);
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [isDeskRejecting, setIsDeskRejecting] = useState(false);
  const [showDeskRejectConfirm, setShowDeskRejectConfirm] = useState(false);

  // Auto-trigger "viewed by editor" when a paper is selected
  const viewedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!selectedId || viewedRef.current.has(selectedId)) return;
    viewedRef.current.add(selectedId);
    markViewedAction(selectedId).catch(() => {});
  }, [selectedId]);

  function assignReviewer(id: string) {
    setAssignedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function removeReviewer(id: string) {
    setAssignedIds((prev) => prev.filter((r) => r !== id));
  }

  async function sendInvites() {
    if (!selectedId || assignedIds.length === 0) return;
    setIsSendingInvites(true);

    const reviewerWallets = assignedIds
      .map((id) => initialReviewerPool.find((r) => r.id === id)?.wallet)
      .filter((w): w is string => !!w);

    if (reviewerWallets.length === 0) {
      setIsSendingInvites(false);
      toast.error('No valid reviewers selected');
      return;
    }

    try {
      await assignReviewersAction(selectedId, reviewerWallets, timelineDays);
      const sentId = selectedId;
      setPapers((prev) => prev.filter((p) => p.id !== sentId));
      setSelectedId(null);
      setAssignedIds([]);
      setReviewerSearch('');
      router.refresh();
      toast.success('Reviewer invites sent');
    } catch (err) {
      console.error('[sendInvites] Unexpected error:', err);
      toast.error('Failed to send invites');
    } finally {
      setIsSendingInvites(false);
    }
  }

  function submitDeskReject() {
    if (!selectedId) return;
    setShowDeskRejectConfirm(true);
  }

  async function confirmDeskReject(): Promise<boolean> {
    if (!selectedId) return false;
    setIsDeskRejecting(true);

    try {
      await makeDecisionAction(selectedId, {
        decision: 'reject',
        comment: deskRejectComment,
      });

      // Success: remove paper from list, clear selection
      const rejectedId = selectedId;
      setPapers((prev) => prev.filter((p) => p.id !== rejectedId));
      setSelectedId(null);
      setDeskRejectComment('');
      setShowDeskRejectConfirm(false);
      router.refresh();
      return true;
    } catch (err) {
      console.error('[deskReject] Unexpected error:', err);
      return false;
    } finally {
      setIsDeskRejecting(false);
    }
  }

  return {
    papers,
    reviewerPool: initialReviewerPool,
    selectedId,
    setSelectedId,
    selected,
    assignedIds,
    assignReviewer,
    removeReviewer,
    reviewerSearch,
    setReviewerSearch,
    deskRejectComment,
    setDeskRejectComment,
    timelineDays,
    setTimelineDays,
    sendInvites,
    submitDeskReject,
    confirmDeskReject,
    isSendingInvites,
    isDeskRejecting,
    showDeskRejectConfirm,
    setShowDeskRejectConfirm,
  };
}
