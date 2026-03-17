'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { getErrorMessage } from '@/src/shared/lib/errors';
import type { DbPendingPoolInvite } from '@/src/features/reviewer/queries';
import { displayNameOrWallet } from '@/src/features/users/lib';
import { respondToPoolInviteAction } from '@/src/features/reviewer/actions';

interface PoolInvitesClientProps {
  initialInvites: DbPendingPoolInvite[];
  editorNames: Record<string, string>;
}

export function PoolInvitesClient({
  initialInvites,
  editorNames,
}: PoolInvitesClientProps) {
  const [invites, setInvites] = useState(initialInvites);
  const [responding, setResponding] = useState<string | null>(null);

  const handleRespond = async (
    inviteId: string,
    status: 'accepted' | 'rejected',
  ) => {
    setResponding(inviteId);
    try {
      await respondToPoolInviteAction(inviteId, status);

      setInvites(invites.filter((i) => i.id !== inviteId));
      toast.success(
        status === 'accepted'
          ? 'Invitation accepted. You are now in the reviewer pool.'
          : 'Invitation declined.',
      );
    } catch (err) {
      const message = getErrorMessage(err, 'An error occurred');
      toast.error(message);
    } finally {
      setResponding(null);
    }
  };

  if (invites.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-10 py-8">
        <h1 className="text-[28px] font-normal text-[#e8e0d4] m-0 tracking-[0.5px] font-serif mb-8">
          Pool Invitations
        </h1>
        <div
          className="py-12 text-center text-[14px] text-[#8a8070] italic rounded-[8px]"
          style={{
            background: 'rgba(45,42,38,0.5)',
            border: '1px solid rgba(120,110,95,0.15)',
          }}
        >
          No pending invitations
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      <h1 className="text-[28px] font-normal text-[#e8e0d4] m-0 tracking-[0.5px] font-serif mb-8">
        Pool Invitations
      </h1>

      <div className="space-y-4">
        {invites.map((invite) => {
          const editorName = invite.journal?.editorWallet
            ? editorNames[invite.journal.editorWallet.toLowerCase()] ||
              displayNameOrWallet(null, invite.journal.editorWallet)
            : 'Unknown';

          return (
            <div
              key={invite.id}
              className="rounded-[8px] p-6 flex items-center justify-between"
              style={{
                background: 'rgba(45,42,38,0.5)',
                border: '1px solid rgba(120,110,95,0.15)',
              }}
            >
              <div className="flex-1">
                <div className="text-[14px] font-serif text-[#e8e0d4] mb-1">
                  {invite.journal?.name}
                </div>
                <div className="text-[12px] text-[#8a8070]">
                  Edited by {editorName}
                </div>
                <div className="text-[11px] text-[#6a6050] mt-2">
                  Invited{' '}
                  {new Date(String(invite.addedAt)).toLocaleDateString()}
                </div>
              </div>

              <div className="flex gap-3 ml-6">
                <button
                  data-testid="pool-invite-accept"
                  onClick={() => handleRespond(invite.id, 'accepted')}
                  disabled={responding === invite.id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-[6px] font-serif text-[12px] transition-opacity disabled:opacity-50"
                  style={{
                    background: 'rgba(143, 188, 143, 0.15)',
                    color: '#8fbc8f',
                    border: '1px solid rgba(143, 188, 143, 0.25)',
                  }}
                >
                  <Check size={14} />
                  Accept
                </button>
                <button
                  data-testid="pool-invite-reject"
                  onClick={() => handleRespond(invite.id, 'rejected')}
                  disabled={responding === invite.id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-[6px] font-serif text-[12px] transition-opacity disabled:opacity-50"
                  style={{
                    background: 'rgba(212, 100, 90, 0.15)',
                    color: '#d4645a',
                    border: '1px solid rgba(212, 100, 90, 0.25)',
                  }}
                >
                  <X size={14} />
                  Decline
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
