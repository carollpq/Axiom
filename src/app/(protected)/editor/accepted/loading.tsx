// Suspense fallback for the accepted papers page (three-column layout).

import { ThreeColumnSkeleton } from '@/src/features/editor/components/skeletons';

export default function AcceptedPapersLoading() {
  return (
    <ThreeColumnSkeleton paperCount={2} sidebarBlocks={['160px', '60px']} />
  );
}
