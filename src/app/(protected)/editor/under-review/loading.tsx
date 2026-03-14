// Suspense fallback for the under-review page (three-column layout).

import { ThreeColumnSkeleton } from '@/src/features/editor/components/skeletons';

export default function UnderReviewLoading() {
  return (
    <ThreeColumnSkeleton
      paperCount={3}
      sidebarBlocks={['180px', '120px', '200px']}
    />
  );
}
