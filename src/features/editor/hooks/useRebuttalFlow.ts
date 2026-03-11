'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { resolveRebuttalAction } from '@/src/features/rebuttals/actions';
import type { RebuttalInfo } from '@/src/features/editor/types';

interface UseRebuttalFlowOptions {
  selectedId: string | null;
  rebuttalsBySubmission?: Record<string, RebuttalInfo>;
}

/** Manages editor-side rebuttal resolution (upheld/rejected/partial). */
export function useRebuttalFlow({
  selectedId,
  rebuttalsBySubmission,
}: UseRebuttalFlowOptions) {
  const [isResolvingRebuttal, setIsResolvingRebuttal] = useState(false);

  const currentRebuttal = useMemo(() => {
    if (!selectedId || !rebuttalsBySubmission) return null;
    return rebuttalsBySubmission[selectedId] ?? null;
  }, [selectedId, rebuttalsBySubmission]);

  async function resolveRebuttal(
    resolution: 'upheld' | 'rejected' | 'partial',
    notes: string,
  ) {
    if (!currentRebuttal) return;
    setIsResolvingRebuttal(true);
    try {
      await resolveRebuttalAction(currentRebuttal.id, resolution, notes);
      toast.success('Rebuttal resolved');
    } catch (err) {
      console.error('[resolveRebuttal] Unexpected error:', err);
      toast.error('Failed to resolve rebuttal');
    } finally {
      setIsResolvingRebuttal(false);
    }
  }

  return {
    currentRebuttal,
    resolveRebuttal,
    isResolvingRebuttal,
  };
}
