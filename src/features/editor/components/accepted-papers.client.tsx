'use client';

import { useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { ThreeColumnLayout } from '@/src/shared/components/three-column-layout';
import { DecryptablePdfViewer } from '@/src/shared/components/decryptable-pdf-viewer.client';
import { PaperList } from '@/src/shared/components/paper-list.client';
import { useSelection } from '@/src/shared/hooks/useSelection';
import { useCollapseSidebar } from '@/src/shared/hooks/useCollapseSidebar';
import { SelectionPlaceholder } from '@/src/shared/components/selection-placeholder';
import { Button } from '@/src/shared/components/button.client';
import { addPaperToIssueAction } from '@/src/features/editor/actions';
import { publishPaperAction } from '@/src/features/submissions/actions';
import { getErrorMessage } from '@/src/shared/lib/errors';
import type {
  PaperCardData,
  ReviewerWithStatus,
  JournalIssue,
} from '@/src/features/editor/types';

const ReviewCommentsPanel = dynamic(
  () =>
    import('./sidebar/review-comments-panel').then((m) => ({
      default: m.ReviewCommentsPanel,
    })),
  {
    loading: () => (
      <div className="p-6 text-[13px] text-[#6a6050]">Loading reviews...</div>
    ),
  },
);
const PublishDialog = dynamic(
  () =>
    import('./sidebar/publish-dialog.client').then((m) => ({
      default: m.PublishDialog,
    })),
  { ssr: false },
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
  const { selectedId, setSelectedId, selected } = useSelection(papers);
  const currentReviewers = useMemo(
    () => (selectedId ? (reviewStatuses[selectedId] ?? []) : []),
    [selectedId, reviewStatuses],
  );

  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  const isSelectedPublished = selected?.status === 'published';

  const handlePublish = useCallback(
    async (issueId?: string) => {
      if (!selectedId) return;
      setIsPublishing(true);
      try {
        // Assign to issue first if selected
        if (issueId) {
          await addPaperToIssueAction(journalId, issueId, selectedId);
        }
        await publishPaperAction(selectedId);
        setShowPublishDialog(false);
        toast.success('Paper published successfully');
        router.refresh();
      } catch (err) {
        const message = getErrorMessage(err, 'Failed to publish paper');
        toast.error(message);
      } finally {
        setIsPublishing(false);
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
          emptyMessage="No papers in this stage."
        />
      }
      viewer={
        <DecryptablePdfViewer
          paperId={selected?.paperId}
          hasLitData={selected?.hasLitData}
          fallbackFileUrl={selected?.fileUrl}
          title={selected?.title}
        />
      }
      sidebar={
        selectedId ? (
          <>
            {isSelectedPublished && (
              <div
                className="mx-4 mt-4 p-3 rounded-[6px] text-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(120,180,120,0.15), rgba(100,160,100,0.08))',
                  border: '1px solid rgba(120,180,120,0.35)',
                }}
              >
                <div
                  className="text-[13px] font-serif font-semibold mb-0.5"
                  style={{ color: '#8fbc8f' }}
                >
                  Published
                </div>
                <div className="text-[11px] text-[#8a8070]">
                  This paper has been published. Reputation tokens were minted
                  for all reviewers.
                </div>
              </div>
            )}
            <ReviewCommentsPanel reviewers={currentReviewers} />
            {!isSelectedPublished && (
              <div className="p-4">
                <Button
                  variant="gold"
                  fullWidth
                  onClick={() => setShowPublishDialog(true)}
                >
                  Publish Paper
                </Button>
              </div>
            )}
            {showPublishDialog && selected && (
              <PublishDialog
                isOpen={showPublishDialog}
                onClose={() => setShowPublishDialog(false)}
                onPublish={handlePublish}
                paperTitle={selected.title}
                issues={issues}
                isPublishing={isPublishing}
              />
            )}
          </>
        ) : (
          <SelectionPlaceholder message="Select a paper to view details" />
        )
      }
    />
  );
}
