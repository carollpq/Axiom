import { DashboardSkeleton } from '@/src/features/editor/components/skeletons';

export default function EditorDashboardLoading() {
  return (
    <div className="max-w-full mx-auto px-12 py-8">
      <DashboardSkeleton />
    </div>
  );
}
