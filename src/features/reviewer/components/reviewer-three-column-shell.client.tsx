'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { ThreeColumnLayout } from '@/src/shared/components/three-column-layout';
import { SelectionPlaceholder } from '@/src/shared/components/selection-placeholder';
import { PaperList } from '@/src/shared/components/paper-list.client';
import { DecryptablePdfViewer } from '@/src/shared/components/decryptable-pdf-viewer.client';
import { useCollapseSidebar } from '@/src/shared/hooks/useCollapseSidebar';
import { toReviewerPaperListItems } from '@/src/features/reviewer/lib/dashboard';

interface ItemWithPdf {
  id: number;
  paperId?: string;
  title: string;
  authors?: string[];
  abstract?: string;
  pdfUrl?: string;
  hasLitData?: boolean;
}

interface Props<T extends ItemWithPdf> {
  items: T[];
  title: string;
  countLabel: string;
  sidebarTitle: string;
  emptyMessage?: string;
  renderSidebar: (selected: T, index: number) => ReactNode;
  sidebarPlaceholder?: string;
}

export function ReviewerThreeColumnShell<T extends ItemWithPdf>({
  items,
  title,
  countLabel,
  sidebarTitle,
  emptyMessage = 'No items found.',
  renderSidebar,
  sidebarPlaceholder = 'Select a paper to see details',
}: Props<T>) {
  useCollapseSidebar();

  const [selectedId, setSelectedId] = useState<string | null>(() =>
    items[0] ? String(items[0].id) : null,
  );

  const paperItems = useMemo(() => toReviewerPaperListItems(items), [items]);

  // Derive effective selection: fall back to first item if selected was removed
  const { selected, selectedIndex, effectiveId } = useMemo(() => {
    const idx = items.findIndex((p) => String(p.id) === selectedId);
    if (idx >= 0) {
      return {
        selected: items[idx],
        selectedIndex: idx,
        effectiveId: selectedId,
      };
    }
    // Selected item was removed — fall back to first
    if (items.length > 0) {
      return {
        selected: items[0],
        selectedIndex: 0,
        effectiveId: String(items[0].id),
      };
    }
    return { selected: null, selectedIndex: -1, effectiveId: null };
  }, [items, selectedId]);

  return (
    <ThreeColumnLayout
      title={title}
      countLabel={countLabel}
      list={
        <PaperList
          papers={paperItems}
          selectedId={effectiveId}
          onSelect={setSelectedId}
          emptyMessage={emptyMessage}
        />
      }
      viewer={
        selected ? (
          <DecryptablePdfViewer
            paperId={selected.paperId}
            hasLitData={selected.hasLitData}
            fallbackFileUrl={selected.pdfUrl}
            title={selected.title}
          />
        ) : (
          <SelectionPlaceholder message="Select a paper to view" />
        )
      }
      sidebar={
        selected ? (
          renderSidebar(selected, selectedIndex)
        ) : (
          <div className="p-4 text-[12px] text-[#6a6050]">
            {sidebarPlaceholder}
          </div>
        )
      }
      sidebarTitle={sidebarTitle}
    />
  );
}
