'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { ThreeColumnLayout } from '@/src/shared/components/ThreeColumnLayout';
import { DynamicPdfViewer as PdfViewer } from '@/src/shared/components/DynamicPdfViewer';
import { PaperList } from './PaperList.client';
import { useAcceptedPapers } from '@/src/features/editor/hooks/useAcceptedPapers';
import { useCollapseSidebar } from '@/src/shared/hooks/useCollapseSidebar';
import { useDecryptPaper } from '@/src/shared/hooks/useDecryptPaper';
import { SelectionPlaceholder } from '@/src/shared/components/SelectionPlaceholder';
import type {
  PaperCardData,
  ReviewerWithStatus,
  JournalIssue,
} from '@/src/features/editor/types';

const ReviewCommentsPanel = dynamic(
  () =>
    import('./sidebar/ReviewCommentsPanel').then((m) => ({
      default: m.ReviewCommentsPanel,
    })),
  {
    loading: () => (
      <div className="p-6 text-[13px] text-[#6a6050]">Loading reviews...</div>
    ),
  },
);
const AddToIssuePanel = dynamic(
  () =>
    import('./sidebar/AddToIssuePanel').then((m) => ({
      default: m.AddToIssuePanel,
    })),
  {
    loading: () => (
      <div className="p-6 text-[13px] text-[#6a6050]">Loading...</div>
    ),
  },
);

interface AcceptedPapersProps {
  papers: PaperCardData[];
  reviewStatuses: Record<string, ReviewerWithStatus[]>;
  issues: JournalIssue[];
  journalId: string;
}

export function AcceptedPapersClient({
  papers,
  reviewStatuses,
  issues,
  journalId,
}: AcceptedPapersProps) {
  useCollapseSidebar();
  const router = useRouter();
  const {
    selectedId,
    setSelectedId,
    selected,
    currentReviewers,
    selectedIssue,
    setSelectedIssue,
  } = useAcceptedPapers(papers, reviewStatuses);

  const { fileUrl: decryptedUrl } = useDecryptPaper(
    selected?.hasLitData ? selected.paperId : null,
    true,
  );

  const handleAssignToIssue = useCallback(
    async (issueId: string) => {
      if (!selectedId) return;
      try {
        const res = await fetch(
          `/api/journals/${journalId}/issues/${issueId}/papers`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionId: selectedId }),
          },
        );
        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error || 'Failed to assign paper');
        }
        toast.success('Paper assigned to issue');
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to assign paper';
        toast.error(message);
      }
    },
    [journalId, selectedId, router],
  );

  return (
    <ThreeColumnLayout
      title="Accepted Papers"
      subtitle="Manage accepted papers and publications"
      countLabel={`${papers.length} ${papers.length === 1 ? 'paper' : 'papers'}`}
      sidebarTitle="Details"
      list={
        <PaperList
          papers={papers}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      }
      viewer={
        <PdfViewer
          fileUrl={decryptedUrl ?? selected?.fileUrl}
          title={selected?.title}
        />
      }
      sidebar={
        selectedId ? (
          <>
            <ReviewCommentsPanel reviewers={currentReviewers} />
            <AddToIssuePanel
              issues={issues}
              selectedIssue={selectedIssue}
              onIssueChange={setSelectedIssue}
              onAssign={handleAssignToIssue}
            />
          </>
        ) : (
          <SelectionPlaceholder message="Select a paper to view details" />
        )
      }
    />
  );
}
