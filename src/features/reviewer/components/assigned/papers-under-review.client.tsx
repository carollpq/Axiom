'use client';

import { useState, useMemo } from 'react';
import { ThreeColumnLayout } from '@/src/shared/components/ThreeColumnLayout';
import { SelectionPlaceholder } from '@/src/shared/components/SelectionPlaceholder';
import { PaperList } from '@/src/shared/components/PaperList';
import { DynamicPdfViewer } from '@/src/shared/components/DynamicPdfViewer';
import { useCollapseSidebar } from '@/src/shared/hooks/useCollapseSidebar';
import type { DbAssignedReview } from '@/src/features/reviewer/queries';
import {
  mapDbToAssignedReviewExtended,
  toReviewerPaperListItems,
} from '@/src/features/reviewer/mappers/dashboard';
import { AssignedReviewSidebar } from './assigned-review-sidebar.client';

interface Props {
  initialRaw: DbAssignedReview[];
}

export function PapersUnderReviewClient({ initialRaw }: Props) {
  useCollapseSidebar();

  const mapped = useMemo(
    () => initialRaw.map(mapDbToAssignedReviewExtended),
    [initialRaw],
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    mapped[0] ? String(mapped[0].id) : null,
  );

  const paperItems = useMemo(() => toReviewerPaperListItems(mapped), [mapped]);

  const selectedIndex = mapped.findIndex((p) => String(p.id) === selectedId);
  const selected = selectedIndex >= 0 ? mapped[selectedIndex] : null;
  const selectedRaw = selectedIndex >= 0 ? initialRaw[selectedIndex] : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1816' }}>
      <ThreeColumnLayout
        title="Papers Under Review"
        countLabel={`${mapped.length} paper${mapped.length !== 1 ? 's' : ''}`}
        list={
          <PaperList
            papers={paperItems}
            selectedId={selectedId}
            onSelect={setSelectedId}
            emptyMessage="No papers under review."
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
          selected && selectedRaw ? (
            <AssignedReviewSidebar
              paper={selected}
              rawAssignment={selectedRaw}
            />
          ) : (
            <div className="p-4 text-[12px] text-[#6a6050]">
              Select a paper to see details
            </div>
          )
        }
        sidebarTitle="Review Details"
      />
    </div>
  );
}
