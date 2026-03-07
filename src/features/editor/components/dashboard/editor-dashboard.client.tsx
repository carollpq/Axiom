'use client';

import { DashboardGridLayout } from '@/src/shared/components/DashboardGridLayout';
import { ProfileCard } from '@/src/shared/components/ProfileCard';
import { DashboardCard } from '@/src/shared/components/DashboardCard';
import { StatsSection } from './stats.section';
import { CarouselSection } from './carousel.section';
import type { EditorProfile } from '@/src/features/editor/types';
import type { DbJournalSubmission } from '@/src/features/editor/queries';

interface Props {
  subs: DbJournalSubmission[];
  editorProfile: EditorProfile | null;
}

export function EditorDashboardClient({ subs, editorProfile }: Props) {
  return (
    <DashboardGridLayout
      role="editor"
      left={
        <>
          <DashboardCard>
            <StatsSection subs={subs} />
          </DashboardCard>
          <DashboardCard>
            <CarouselSection subs={subs} />
          </DashboardCard>
        </>
      }
      right={
        editorProfile ? (
          <ProfileCard
            name={editorProfile.name}
            subtitle={editorProfile.affiliation}
            secondarySubtitle={editorProfile.journalName}
            initials={editorProfile.initials}
          />
        ) : null
      }
    />
  );
}
