'use client';

import { DashboardHeader } from '@/src/shared/components';
import type { AssignedReviewExtended } from '@/src/features/reviewer/types';
import { InviteCardList } from './invite-card-list.client';

interface Props {
  extendedInvites?: AssignedReviewExtended[];
}

export function IncomingInvitesClient({ extendedInvites = [] }: Props) {
  const pendingInvites = extendedInvites.filter((a) => a.status === 'Pending');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1816' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8">
        <DashboardHeader role="reviewer" />

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#d4ccc0' }}>
            Incoming Invites ({pendingInvites.length})
          </h2>
          <InviteCardList invites={pendingInvites} />
        </div>
      </div>
    </div>
  );
}
