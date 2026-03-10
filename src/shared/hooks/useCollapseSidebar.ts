'use client';

import { useEffect } from 'react';
import { useSidebar } from '@/src/shared/context/sidebar-context.client';

/** Collapse the main navigation sidebar on mount and restore on unmount. */
export function useCollapseSidebar() {
  const { collapsed, setCollapsed } = useSidebar();

  useEffect(() => {
    const wasCollapsed = collapsed;
    setCollapsed(true);
    return () => setCollapsed(wasCollapsed);
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
