// Suspense fallback for the incoming papers page (three-column layout).

import { ThreeColumnSkeleton } from '@/src/features/editor/components/skeletons';

export default function IncomingPapersLoading() {
  return (
    <ThreeColumnSkeleton paperCount={4} sidebarBlocks={['200px', '150px']} />
  );
}
