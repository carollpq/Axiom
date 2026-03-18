'use client';

import { useState } from 'react';
import { SearchInput } from '@/src/shared/components/search-input.client';
import { Button } from '@/src/shared/components/button.client';
import { SidebarSection } from '@/src/shared/components/sidebar-section';
import { ListRow } from '@/src/shared/components/list-row';
import type { PoolReviewer } from '@/src/features/editor/types';

interface AssignReviewersPanelProps {
  reviewerPool: PoolReviewer[];
  assignedIds: string[];
  search: string;
  onSearchChange: (v: string) => void;
  onAssign: (id: string) => void;
  onRemove: (id: string) => void;
  timelineDays: number;
  onTimelineChange?: (days: number) => void;
  actionLabel?: string;
  onAction?: () => void;
  isLoading?: boolean;
}

export function AssignReviewersPanel({
  reviewerPool,
  assignedIds,
  search,
  onSearchChange,
  onAssign,
  onRemove,
  timelineDays,
  onTimelineChange,
  actionLabel = 'Send Invites',
  onAction,
  isLoading = false,
}: AssignReviewersPanelProps) {
  const [minReputation, setMinReputation] = useState(0);

  const assignedSet = new Set(assignedIds);
  const assigned = reviewerPool.filter((r) => assignedSet.has(r.id));
  const filtered = reviewerPool
    .filter((r) => !assignedSet.has(r.id))
    .filter((r) => r.score >= minReputation)
    .filter(
      (r) =>
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.field.toLowerCase().includes(search.toLowerCase()),
    );

  const handleMinReputationChange = (value: number) => {
    setMinReputation(value);
    // Auto-remove assigned reviewers that fall below new threshold
    const toRemove = assigned.filter((r) => r.score < value).map((r) => r.id);
    for (const id of toRemove) {
      onRemove(id);
    }
  };

  return (
    <SidebarSection title="Assign Reviewers">
      <div
        style={{
          opacity: isLoading ? 0.45 : 1,
          pointerEvents: isLoading ? 'none' : 'auto',
          transition: 'opacity 0.2s',
        }}
      >
        <SearchInput
          compact
          value={search}
          onChange={onSearchChange}
          placeholder="Search reviewers..."
        />

        {/* Reputation score filter */}
        <div className="mt-3 px-1">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] text-[#8a8070] font-serif">
              Min Score
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
              handleMinReputationChange(parseFloat(e.target.value) / 10)
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

        {/* Assigned list */}
        {assigned.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {assigned.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-3 py-2 rounded"
                style={{
                  background: 'rgba(45,42,38,0.6)',
                  border: '1px solid rgba(120,110,95,0.15)',
                }}
              >
                <div className="inline-flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[12px] text-[#d4ccc0] font-serif truncate">
                    {r.name}
                  </span>
                  <span className="text-[10px] text-[#c9a44a] font-serif font-bold shrink-0">
                    {r.score.toFixed(1)}
                  </span>
                </div>
                <button
                  onClick={() => onRemove(r.id)}
                  className="text-[#6a6050] hover:text-[#d4645a] text-sm cursor-pointer"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Unassigned pool */}
        {search && filtered.length > 0 && (
          <div className="mt-2 space-y-1">
            {filtered.slice(0, 4).map((r) => (
              <button
                key={r.id}
                onClick={() => onAssign(r.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded text-left cursor-pointer transition-colors"
                style={{
                  background: 'rgba(30,28,24,0.5)',
                  border: '1px solid rgba(120,110,95,0.1)',
                }}
              >
                <div className="min-w-0 truncate flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[#c9b89e] font-serif">
                      {r.name}
                    </span>
                    <span className="text-[10px] text-[#c9a44a] font-serif font-bold shrink-0">
                      {r.score.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6a6050]">
                    {r.field} &middot; {r.reviews} reviews
                  </span>
                </div>
                <span className="text-[10px] text-[#8a8070] shrink-0 ml-2">
                  + Add
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timeline + action */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-[#8a8070] font-serif whitespace-nowrap">
            Review Deadline:
          </label>
          {onTimelineChange ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={7}
                max={90}
                value={timelineDays}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v)) onTimelineChange(Math.max(7, Math.min(90, v)));
                }}
                className="w-14 px-2 py-1 rounded text-[11px] font-serif text-[#d4ccc0] text-center"
                style={{
                  background: 'rgba(30,28,24,0.6)',
                  border: '1px solid rgba(120,110,95,0.25)',
                }}
              />
              <span className="text-[11px] text-[#8a8070] font-serif">
                days
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-[#d4ccc0] font-serif">
              {timelineDays} days
            </span>
          )}
        </div>
        {onAction && (
          <Button
            data-testid="send-invites-btn"
            variant="gold"
            onClick={onAction}
            disabled={isLoading}
            className="text-[11px] w-full"
          >
            {isLoading ? 'Sending...' : actionLabel}
          </Button>
        )}
      </div>
    </SidebarSection>
  );
}
