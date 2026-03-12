// Editor dashboard page — shows aggregate stats and a recent-submissions carousel.
// Server-fetches user profile, journal, and submissions, then hands off to the
// client component for interactive stat cards and carousel navigation.

import { Suspense } from 'react';
import { getSession } from '@/src/shared/lib/auth/auth';
import { getUserByWallet } from '@/src/features/users/queries';
import {
  getJournalByEditorWallet,
  listJournalSubmissions,
} from '@/src/features/editor/queries';
import { mapDbToEditorProfile } from '@/src/features/editor/lib/journal';
import { getInitials } from '@/src/shared/lib/format';
import { EditorDashboardClient } from '@/src/features/editor/components/dashboard/editor-dashboard.client';
import { DashboardSkeleton } from '@/src/features/editor/components/skeletons';
import type { EditorProfile } from '@/src/features/editor/types';
import type { DbJournalSubmission } from '@/src/features/editor/queries';

async function EditorContent() {
  const wallet = (await getSession())!;

  const [user, journal] = await Promise.all([
    getUserByWallet(wallet),
    getJournalByEditorWallet(wallet),
  ]);

  const editorProfile: EditorProfile | null = mapDbToEditorProfile(
    user,
    journal,
    getInitials,
  );
  let subs: DbJournalSubmission[] = [];

  if (journal) {
    subs = await listJournalSubmissions(journal.id);
  }

  return <EditorDashboardClient subs={subs} editorProfile={editorProfile} />;
}

export default function JournalDashboard() {
  return (
    <div className="max-w-full mx-auto px-12 py-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <EditorContent />
      </Suspense>
    </div>
  );
}
