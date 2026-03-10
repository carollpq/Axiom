'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import { getErrorMessage } from '@/src/shared/lib/errors';
import type { PoolReviewer } from '@/src/features/editor/types';
import { ModalOverlay } from '@/src/shared/components/modal-overlay.client';

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
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const availableToAdd = (allReviewers ?? []).filter(
    (r) => !reviewers.some((existing) => existing.id === r.id),
  );

  const filteredAvailable = availableToAdd.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.field.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.institution.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAdd = async (wallet: string) => {
    if (!onAddReviewer) return;
    setAdding(true);
    try {
      await onAddReviewer(wallet);
      setShowAddModal(false);
      setSearchTerm('');
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to add reviewer');
      toast.error(message);
    } finally {
      setAdding(false);
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
                          {r.name
                            .split(' ')
                            .filter((_, i, a) => i === 0 || i === a.length - 1)
                            .map((w) => w[0])
                            .join('')}
                        </div>
                        <div className="font-serif text-[#e8e0d4]">
                          {r.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#8a8070]">{r.field}</td>
                    <td className="px-4 py-3 text-[#8a8070]">
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

      <ModalOverlay
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSearchTerm('');
        }}
        maxWidth="512px"
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-serif text-[16px] text-[#e8e0d4]">
            Add Reviewer to Pool
          </h3>
          <button
            onClick={() => {
              setShowAddModal(false);
              setSearchTerm('');
            }}
            className="text-[#6a6050] hover:text-[#d4ccc0] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {availableToAdd.length > 0 ? (
          <>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, field, or institution..."
              className="w-full rounded-[6px] px-3 py-2 text-[12px] font-serif text-[#d4ccc0] outline-none mb-4"
              style={{
                background: 'rgba(30,28,24,0.8)',
                border: '1px solid rgba(120,110,95,0.25)',
              }}
              autoFocus
            />

            <div
              className="space-y-2 max-h-64 overflow-y-auto"
              style={{
                background: 'rgba(30,28,24,0.4)',
                border: '1px solid rgba(120,110,95,0.15)',
                borderRadius: '6px',
              }}
            >
              {filteredAvailable.length === 0 ? (
                <div className="py-6 text-center text-[12px] text-[#6a6050] italic">
                  No reviewers match your search.
                </div>
              ) : (
                filteredAvailable.map((r) => (
                  <button
                    key={r.id}
                    className="w-full text-left px-4 py-3 transition-colors"
                    style={{
                      borderBottom: '1px solid rgba(120,110,95,0.1)',
                      background: 'rgba(30,28,24,0.2)',
                    }}
                    onClick={() => handleAdd(r.wallet)}
                  >
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
                        {r.name
                          .split(' ')
                          .filter((_, i, a) => i === 0 || i === a.length - 1)
                          .map((w) => w[0])
                          .join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-serif text-[12px] text-[#e8e0d4]">
                          {r.name}
                        </div>
                        <div className="text-[11px] text-[#8a8070]">
                          {r.field} • {r.institution}
                        </div>
                      </div>
                      <div
                        className="px-2 py-1 rounded-[4px] text-[11px] font-serif shrink-0"
                        style={{
                          background: 'rgba(143, 188, 143, 0.15)',
                          color: '#8fbc8f',
                        }}
                      >
                        {r.score.toFixed(1)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="py-6 text-center text-[12px] text-[#6a6050] italic">
            All reviewers are already in the pool.
          </div>
        )}
      </ModalOverlay>
    </div>
  );
}
