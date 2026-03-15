'use client';

import dynamic from 'next/dynamic';
import { LazyFallback } from './lazy-fallback';
import { ThreeColumnLayout } from '@/src/shared/components/three-column-layout';
import { DynamicPdfViewer as PdfViewer } from '@/src/shared/components/dynamic-pdf-viewer.client';
import { PaperList } from '@/src/shared/components/paper-list.client';
import { useIncomingPapers } from '@/src/features/editor/hooks/useIncomingPapers';
import { useCollapseSidebar } from '@/src/shared/hooks/useCollapseSidebar';
import { useDecryptPaper } from '@/src/shared/hooks/useDecryptPaper';
import { SelectionPlaceholder } from '@/src/shared/components/selection-placeholder';
import { ConfirmDialog } from '@/src/shared/components/confirm-dialog.client';
import { toast } from 'sonner';
import type { PaperCardData, PoolReviewer } from '@/src/features/editor/types';

const CriteriaBuilder = dynamic(
  () =>
    import('./criteria-builder.client').then((m) => ({
      default: m.CriteriaBuilder,
    })),
  { loading: LazyFallback },
);
const AssignReviewersPanel = dynamic(
  () =>
    import('./sidebar/assign-reviewers-panel.client').then((m) => ({
      default: m.AssignReviewersPanel,
    })),
  { loading: LazyFallback },
);
const DeskRejectPanel = dynamic(
  () =>
    import('./sidebar/desk-reject-panel.client').then((m) => ({
      default: m.DeskRejectPanel,
    })),
  { loading: LazyFallback },
);

interface IncomingPapersProps {
  papers: PaperCardData[];
  reviewerPool: PoolReviewer[];
}

export function IncomingPapersClient({
  papers: initialPapers,
  reviewerPool,
}: IncomingPapersProps) {
  useCollapseSidebar();
  const {
    papers,
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
    sendInvites,
    isSendingInvites,
    submitDeskReject,
    confirmDeskReject,
    isDeskRejecting,
    showDeskRejectConfirm,
    setShowDeskRejectConfirm,
  } = useIncomingPapers(initialPapers, reviewerPool);

  const { fileUrl: decryptedUrl } = useDecryptPaper(
    selected?.hasLitData ? selected.paperId : null,
    true,
  );

  async function handleConfirmDeskReject() {
    const success = await confirmDeskReject();
    if (success) {
      toast.success('Paper rejected successfully');
    } else {
      toast.error('Failed to reject paper. Please try again.');
    }
  }

  return (
    <>
      <ThreeColumnLayout
        title="Incoming Papers"
        subtitle="Review new submissions and set criteria"
        countLabel={`${papers.length} ${papers.length === 1 ? 'paper' : 'papers'}`}
        sidebarTitle="Actions"
        list={
          <PaperList
            papers={papers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            emptyMessage="No papers in this stage."
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
              <CriteriaBuilder
                submissionId={selectedId}
                alreadyPublished={selected?.criteriaPublished ?? false}
              />
              <AssignReviewersPanel
                reviewerPool={reviewerPool}
                assignedIds={assignedIds}
                search={reviewerSearch}
                onSearchChange={setReviewerSearch}
                onAssign={assignReviewer}
                onRemove={removeReviewer}
                timelineDays={timelineDays}
                actionLabel="Send Invites"
                onAction={sendInvites}
                isLoading={isSendingInvites}
              />
              <DeskRejectPanel
                comment={deskRejectComment}
                onCommentChange={setDeskRejectComment}
                onSend={submitDeskReject}
                isLoading={isDeskRejecting}
              />
            </>
          ) : (
            <SelectionPlaceholder message="Select a paper to view actions" />
          )
        }
      />
      <ConfirmDialog
        isOpen={showDeskRejectConfirm}
        onClose={() => setShowDeskRejectConfirm(false)}
        onConfirm={handleConfirmDeskReject}
        title="Desk Reject"
        message="Reject this paper? This action cannot be undone."
        confirmLabel="Reject"
        confirmVariant="red"
        isLoading={isDeskRejecting}
        loadingLabel="Rejecting..."
      />
    </>
  );
}
