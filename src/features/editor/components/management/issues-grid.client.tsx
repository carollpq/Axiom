'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { JournalIssue } from '@/src/features/editor/types';
import { IssueCreateForm } from './issue-create-form.client';

interface IssuesGridProps {
  issues: JournalIssue[];
  onCreateIssue?: (label: string) => Promise<void>;
}

export function IssuesGrid({ issues, onCreateIssue }: IssuesGridProps) {
  const [selectedIssue, setSelectedIssue] = useState<JournalIssue | null>(
    issues.length > 0 ? issues[0] : null,
  );
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="mb-12">
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-5 flex items-center justify-between">
        <span>Issues & Volumes</span>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-[11px] font-serif"
          style={{
            background:
              'linear-gradient(135deg, rgba(180,160,120,0.2), rgba(160,140,100,0.1))',
            border: '1px solid rgba(180,160,120,0.4)',
            color: '#d4c8a8',
          }}
        >
          <Plus size={14} />
          New Issue
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Issues List */}
        <div
          className="col-span-3 rounded-[8px] p-4 overflow-y-auto"
          style={{
            background: 'rgba(45,42,38,0.5)',
            border: '1px solid rgba(120,110,95,0.15)',
            maxHeight: 400,
          }}
        >
          {issues.length === 0 ? (
            <div className="text-center text-[12px] text-[#6a6050] italic py-6">
              No issues yet.
            </div>
          ) : (
            <div className="space-y-2">
              {issues.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue)}
                  className="w-full text-left px-3 py-2.5 rounded-[6px] transition-colors"
                  style={{
                    background:
                      selectedIssue?.id === issue.id
                        ? 'rgba(180,160,120,0.2)'
                        : 'transparent',
                    borderLeft: `3px solid ${
                      selectedIssue?.id === issue.id ? '#c9a44a' : 'transparent'
                    }`,
                    color: '#d4ccc0',
                  }}
                >
                  <div className="font-serif text-[13px]">{issue.label}</div>
                  <div className="text-[11px] text-[#6a6050]">
                    {issue.paperCount} paper{issue.paperCount !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Issue Details */}
        <div
          className="col-span-9 rounded-[8px] p-6"
          style={{
            background: 'rgba(45,42,38,0.5)',
            border: '1px solid rgba(120,110,95,0.15)',
          }}
        >
          {selectedIssue ? (
            <>
              <h3 className="font-serif text-[18px] text-[#e8e0d4] mb-4">
                {selectedIssue.label}
              </h3>
              <p className="text-[12px] text-[#8a8070] mb-6">
                {selectedIssue.paperCount} paper
                {selectedIssue.paperCount !== 1 ? 's' : ''} assigned
              </p>
              {selectedIssue.papers && selectedIssue.papers.length > 0 ? (
                <div>
                  <div className="text-[11px] text-[#6a6050] uppercase tracking-[1px] mb-3">
                    Assigned Papers
                  </div>
                  <div className="space-y-2">
                    {selectedIssue.papers.map((p) => (
                      <div
                        key={p.submissionId}
                        className="text-[12px] text-[#d4ccc0] font-serif py-2.5 px-3 rounded"
                        style={{ background: 'rgba(30,28,24,0.5)' }}
                      >
                        {p.title}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[12px] text-[#6a6050] italic">
                  No papers assigned to this issue yet.
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-[12px] text-[#6a6050] italic">
              Select an issue to view details
            </div>
          )}
        </div>
      </div>

      {onCreateIssue && (
        <IssueCreateForm
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onCreateIssue={onCreateIssue}
        />
      )}
    </div>
  );
}
