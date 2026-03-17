'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { getErrorMessage } from '@/src/shared/lib/errors';
import type { PoolReviewer } from '@/src/features/editor/types';
import { getInitials } from '@/src/shared/lib/format';
import { ReviewerSearchModal } from './reviewer-search-modal.client';

interface ReviewerGridProps {
  reviewers: PoolReviewer[];
  allReviewers?: PoolReviewer[];
  onAddReviewer?: (wallet: string) => Promise<void>;
}

export function ReviewerGrid({
  reviewers,
  allReviewers,
  onAddReviewer,
}: ReviewerGridProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const poolIds = useMemo(
    () => new Set(reviewers.map((r) => r.id)),
    [reviewers],
  );

  const availableToAdd = useMemo(
    () => (allReviewers ?? []).filter((r) => !poolIds.has(r.id)),
    [allReviewers, poolIds],
  );

  const closeModal = () => {
    setShowAddModal(false);
    setSearchTerm('');
  };

  const handleAdd = async (wallet: string) => {
    if (!onAddReviewer) return;
    setIsLoading(true);
    try {
      await onAddReviewer(wallet);
      closeModal();
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to add reviewer');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-5 flex items-center justify-between">
        <span>Reviewer Pool</span>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-[11px] font-serif"
          style={{
            background:
              'linear-gradient(135deg, rgba(180,160,120,0.2), rgba(160,140,100,0.1))',
            border: '1px solid rgba(180,160,120,0.4)',
            color: '#d4c8a8',
          }}
        >
          <Plus size={14} />
          Add Reviewer
        </button>
      </div>

      <div
        className="rounded-[8px] overflow-hidden"
        style={{
          background: 'rgba(45,42,38,0.5)',
          border: '1px solid rgba(120,110,95,0.15)',
        }}
      >
        {reviewers.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-[#6a6050] italic">
            No reviewers in pool yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] text-[#d4ccc0]">
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid rgba(120,110,95,0.2)',
                    background: 'rgba(30,28,24,0.3)',
                  }}
                >
                  <th className="text-left px-4 py-3 font-serif text-[11px] text-[#8a8070] uppercase tracking-[0.5px] font-normal">
                    Reviewer
                  </th>
                  <th className="text-left px-4 py-3 font-serif text-[11px] text-[#8a8070] uppercase tracking-[0.5px] font-normal">
                    Field
                  </th>
                  <th className="text-left px-4 py-3 font-serif text-[11px] text-[#8a8070] uppercase tracking-[0.5px] font-normal">
                    Institution
                  </th>
                  <th className="text-center px-4 py-3 font-serif text-[11px] text-[#8a8070] uppercase tracking-[0.5px] font-normal">
                    Score
                  </th>
                  <th className="text-center px-4 py-3 font-serif text-[11px] text-[#8a8070] uppercase tracking-[0.5px] font-normal">
                    Reviews
                  </th>
                  <th className="text-center px-4 py-3 font-serif text-[11px] text-[#8a8070] uppercase tracking-[0.5px] font-normal">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviewers.map((r, idx) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom:
                        idx < reviewers.length - 1
                          ? '1px solid rgba(120,110,95,0.1)'
                          : 'none',
                      background:
                        idx % 2 === 0
                          ? 'rgba(30,28,24,0.2)'
                          : 'rgba(30,28,24,0.1)',
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-full flex items-center justify-center font-serif shrink-0"
                          style={{
                            width: 32,
                            height: 32,
                            background:
                              'linear-gradient(135deg, rgba(120,110,95,0.3), rgba(80,72,60,0.3))',
                            border: '1px solid rgba(120,110,95,0.3)',
                            color: '#c9b89e',
                            fontSize: '11px',
                          }}
                        >
                          {getInitials(r.name)}
                        </div>
                        <div className="font-serif text-[#e8e0d4] max-w-[180px] truncate">
                          {r.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#8a8070]">{r.field}</td>
                    <td className="px-4 py-3 text-[#8a8070] max-w-[180px] truncate">
                      {r.institution}
                    </td>
                    <td className="px-4 py-3 text-center font-serif">
                      <span
                        className="px-2 py-1 rounded-[4px]"
                        style={{
                          background: 'rgba(143, 188, 143, 0.15)',
                          color: '#8fbc8f',
                        }}
                      >
                        {r.score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{r.reviews}</td>
                    <td className="px-4 py-3 text-center">
                      {r.poolInviteStatus ? (
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-[10px] font-serif uppercase tracking-[0.5px]"
                          style={{
                            background:
                              r.poolInviteStatus === 'pending'
                                ? 'rgba(201, 164, 74, 0.15)'
                                : r.poolInviteStatus === 'accepted'
                                  ? 'rgba(143, 188, 143, 0.15)'
                                  : 'rgba(212, 100, 90, 0.15)',
                            color:
                              r.poolInviteStatus === 'pending'
                                ? '#c9a44a'
                                : r.poolInviteStatus === 'accepted'
                                  ? '#8fbc8f'
                                  : '#d4645a',
                          }}
                        >
                          {r.poolInviteStatus === 'pending'
                            ? 'Pending'
                            : r.poolInviteStatus === 'accepted'
                              ? 'Accepted'
                              : 'Rejected'}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReviewerSearchModal
        isOpen={showAddModal}
        onClose={closeModal}
        available={availableToAdd}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAdd={handleAdd}
      />
    </div>
  );
}
