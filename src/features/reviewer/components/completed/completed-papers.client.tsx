'use client';

import { useState, useMemo } from 'react';
import { ThreeColumnLayout } from '@/src/shared/components/three-column-layout';
import { SelectionPlaceholder } from '@/src/shared/components/selection-placeholder';
import { PaperList } from '@/src/shared/components/paper-list.client';
import { DynamicPdfViewer } from '@/src/shared/components/dynamic-pdf-viewer.client';
import { useCollapseSidebar } from '@/src/shared/hooks/useCollapseSidebar';
import type { CompletedReviewExtended } from '@/src/features/reviewer/types/dashboard';
import { toReviewerPaperListItems } from '@/src/features/reviewer/lib/dashboard';
import { CompletedReviewSidebar } from './completed-review-sidebar.client';

interface Props {
  initialCompleted: CompletedReviewExtended[];
}

export function CompletedPapersClient({ initialCompleted }: Props) {
  useCollapseSidebar();
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCompleted.length > 0 ? String(initialCompleted[0].id) : null,
  );

  const paperItems = useMemo(
    () => toReviewerPaperListItems(initialCompleted),
    [initialCompleted],
  );
  const selected =
    initialCompleted.find((p) => String(p.id) === selectedId) ?? null;

  return (
    <>
      <ThreeColumnLayout
        title="Completed Reviews"
        countLabel={`${initialCompleted.length} review${initialCompleted.length !== 1 ? 's' : ''}`}
        list={
          <PaperList
            papers={paperItems}
            selectedId={selectedId}
            onSelect={setSelectedId}
            emptyMessage="No completed reviews."
          />
        }
        viewer={
          selected?.pdfUrl ? (
            <DynamicPdfViewer fileUrl={selected.pdfUrl} />
          ) : (
            <SelectionPlaceholder
              message={selected ? 'No PDF available' : 'Select a paper to view'}
            />
          )
        }
        sidebar={
          selected ? (
            <CompletedReviewSidebar paper={selected} />
          ) : (
            <div className="p-4 text-[12px] text-[#6a6050]">
              Select a paper to see your review
            </div>
          )
        }
        sidebarTitle="Review Summary"
      />
    </>
  );
}
