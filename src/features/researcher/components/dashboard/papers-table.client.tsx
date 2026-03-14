'use client';

import { useMemo, useState } from 'react';
import { SearchInput } from '@/src/shared/components/search-input.client';
import { StatusBadge } from '@/src/shared/components';
import type { PaperStatus } from '@/src/shared/lib/status-map';

const PAPER_STATUSES: PaperStatus[] = [
  'Draft',
  'Contract Pending',
  'Submitted',
  'Viewed By Editor',
  'Under Review',
  'Reviews Complete',
  'Revision Requested',
  'Published',
];

interface PaperRow {
  id: string;
  title: string;
  status: PaperStatus;
  coauthors: string;
  date: string;
  hash: string;
}

interface Props {
  initialPapers: PaperRow[];
}

export function PapersTable({ initialPapers }: Props) {
  const [statusFilter, setStatusFilter] = useState<'All' | PaperStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPapers = useMemo(() => {
    return initialPapers.filter((p) => {
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.coauthors.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [initialPapers, statusFilter, searchQuery]);

  return (
    <div>
      <div className="flex gap-3 items-center mb-5">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search papers by title or co-author..."
          className="flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'All' | PaperStatus)
          }
          className="appearance-none rounded-[3px] py-[5px] pl-3 pr-7 text-[11px] font-serif cursor-pointer transition-all duration-300 outline-none"
          style={{
            background:
              statusFilter !== 'All'
                ? 'rgba(180,160,120,0.15)'
                : 'rgba(45,42,38,0.5)',
            border: `1px solid ${statusFilter !== 'All' ? 'rgba(180,160,120,0.3)' : 'rgba(120,110,95,0.15)'}`,
            color: statusFilter !== 'All' ? '#c9b89e' : '#6a6050',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236a6050' stroke-width='1.2' fill='none'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
          aria-label="Status"
        >
          <option value="All">Status</option>
          {PAPER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="border border-[rgba(120,110,95,0.15)] rounded-[6px] overflow-hidden">
        {/* Header */}
        <div
          className="grid px-5 py-3 bg-[rgba(45,42,38,0.5)] border-b border-[rgba(120,110,95,0.15)] text-[10px] text-[#6a6050] uppercase tracking-[1.5px]"
          style={{ gridTemplateColumns: '2.5fr 1fr 1fr 0.8fr 0.8fr' }}
        >
          <span>Title</span>
          <span>Status</span>
          <span>Co-authors</span>
          <span>Registered</span>
          <span>On-Chain</span>
        </div>

        {/* Rows */}
        {filteredPapers.map((p, i) => (
          <div
            key={p.id}
            className="grid px-5 py-3.5 items-center cursor-pointer transition-colors duration-200 hover:bg-[rgba(120,110,95,0.08)]"
            style={{
              gridTemplateColumns: '2.5fr 1fr 1fr 0.8fr 0.8fr',
              borderBottom:
                i < filteredPapers.length - 1
                  ? '1px solid rgba(120,110,95,0.08)'
                  : 'none',
            }}
          >
            <span className="text-[13px] text-[#d4ccc0] leading-[1.4] pr-4">
              {p.title}
            </span>
            <span>
              <StatusBadge status={p.status} />
            </span>
            <span className="text-xs text-[#8a8070]">{p.coauthors}</span>
            <span className="text-xs text-[#6a6050]">{p.date}</span>
            <span className="text-[11px] text-[#5a7a9a] font-mono cursor-pointer">
              {p.hash}
            </span>
          </div>
        ))}

        {/* Empty State */}
        {filteredPapers.length === 0 && (
          <div className="p-10 text-center text-[#6a6050] italic">
            No papers match this filter
          </div>
        )}
      </div>
    </div>
  );
}
