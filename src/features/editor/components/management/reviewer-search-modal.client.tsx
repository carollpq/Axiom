'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { getInitials } from '@/src/shared/lib/format';
import type { PoolReviewer } from '@/src/features/editor/types';
import { ModalOverlay } from '@/src/shared/components/modal-overlay.client';

interface ReviewerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  available: PoolReviewer[];
  searchTerm: string;
  onSearchChange: (v: string) => void;
  onAdd: (wallet: string) => void;
}

export function ReviewerSearchModal({
  isOpen,
  onClose,
  available,
  searchTerm,
  onSearchChange,
  onAdd,
}: ReviewerSearchModalProps) {
  const [minReputation, setMinReputation] = useState(0);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return available
      .filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.field.toLowerCase().includes(term) ||
          r.institution.toLowerCase().includes(term),
      )
      .filter((r) => r.score >= minReputation);
  }, [available, searchTerm, minReputation]);

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} maxWidth="512px">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-serif text-[16px] text-[#e8e0d4]">
          Add Reviewer to Pool
        </h3>
        <button
          onClick={onClose}
          className="text-[#6a6050] hover:text-[#d4ccc0] cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {available.length > 0 ? (
        <>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, field, or institution..."
            className="w-full rounded-[6px] px-3 py-2 text-[12px] font-serif text-[#d4ccc0] outline-none mb-4"
            style={{
              background: 'rgba(30,28,24,0.8)',
              border: '1px solid rgba(120,110,95,0.25)',
            }}
            autoFocus
          />

          {/* Reputation score filter */}
          <div
            className="mb-4 p-3 rounded-[6px]"
            style={{
              background: 'rgba(30,28,24,0.4)',
              border: '1px solid rgba(120,110,95,0.15)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] text-[#8a8070] font-serif">
                Minimum Score
              </label>
              <span className="text-[11px] text-[#c9a44a] font-serif font-bold">
                {minReputation.toFixed(1)}/5.0
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={minReputation * 10}
              onChange={(e) =>
                setMinReputation(parseFloat(e.target.value) / 10)
              }
              className="w-full h-1.5 rounded cursor-pointer appearance-none"
              style={{
                background: 'rgba(201,164,74,0.2)',
                accentColor: '#c9a44a',
              }}
            />
            <div className="flex justify-between text-[10px] text-[#6a6050] mt-1">
              <span>0</span>
              <span>5</span>
            </div>
          </div>

          <div
            className="space-y-2 max-h-64 overflow-y-auto"
            style={{
              background: 'rgba(30,28,24,0.4)',
              border: '1px solid rgba(120,110,95,0.15)',
              borderRadius: '6px',
            }}
          >
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-[#6a6050] italic">
                No reviewers match your search.
              </div>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.id}
                  className="w-full text-left px-4 py-3 transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(120,110,95,0.1)',
                    background: 'rgba(30,28,24,0.2)',
                  }}
                  onClick={() => onAdd(r.wallet)}
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
                      {getInitials(r.name)}
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
  );
}
