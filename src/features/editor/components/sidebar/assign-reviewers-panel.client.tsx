'use client';

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
  actionLabel = 'Send Invites',
  onAction,
  isLoading = false,
}: AssignReviewersPanelProps) {
  const assigned = reviewerPool.filter((r) => assignedIds.includes(r.id));
  const filtered = reviewerPool
    .filter((r) => !assignedIds.includes(r.id))
    .filter(
      (r) =>
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.field.toLowerCase().includes(search.toLowerCase()),
    );

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
                <span className="text-[12px] text-[#d4ccc0] font-serif truncate">
                  {r.name}
                </span>
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
                <div className="min-w-0 truncate">
                  <span className="text-[12px] text-[#c9b89e] font-serif">
                    {r.name}
                  </span>
                  <span className="text-[10px] text-[#6a6050] ml-2">
                    {r.field} &middot; {r.score}
                  </span>
                </div>
                <span className="text-[10px] text-[#8a8070] shrink-0">
                  + Assign
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timeline + action */}
      <div className="mt-3 flex items-center gap-2">
        <ListRow className="px-3 py-2 text-[11px] text-[#8a8070] font-serif">
          Assigned Timeline: {timelineDays} days
        </ListRow>
        {onAction && (
          <Button
            variant="gold"
            onClick={onAction}
            disabled={isLoading}
            className="text-[11px]"
          >
            {isLoading ? 'Sending...' : actionLabel}
          </Button>
        )}
      </div>
    </SidebarSection>
  );
}
