'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { JournalIssue } from '@/src/features/editor/types';
import { ModalOverlay } from '@/src/shared/components/ModalOverlay';

interface IssuesGridProps {
  issues: JournalIssue[];
  onCreateIssue?: (label: string) => Promise<void>;
}

export function IssuesGrid({ issues, onCreateIssue }: IssuesGridProps) {
  const [selectedIssue, setSelectedIssue] = useState<JournalIssue | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIssueLabel, setNewIssueLabel] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newIssueLabel.trim() || !onCreateIssue) return;
    setCreating(true);
    try {
      await onCreateIssue(newIssueLabel.trim());
      setShowAddForm(false);
      setNewIssueLabel('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create issue';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-4">
        Issues
      </div>
      <div className="grid grid-cols-4 gap-4">
        {issues.length === 0 && (
          <div className="col-span-4 py-6 text-center text-[13px] text-[#6a6050] italic">
            No issues created yet.
          </div>
        )}
        {issues.map((issue) => (
          <div
            key={issue.id}
            onClick={() => setSelectedIssue(issue)}
            className="rounded-[6px] p-5 flex flex-col items-center justify-center cursor-pointer transition-colors"
            style={{
              background: 'rgba(45,42,38,0.5)',
              border: '1px solid rgba(120,110,95,0.2)',
              minHeight: 100,
            }}
          >
            <div className="font-serif text-sm text-[#e8e0d4]">
              {issue.label}
            </div>
            <div className="text-[11px] text-[#6a6050] mt-1">
              {issue.paperCount} papers
            </div>
          </div>
        ))}

        <div
          onClick={() => setShowAddForm(true)}
          className="rounded-[6px] p-5 flex items-center justify-center cursor-pointer transition-colors"
          style={{
            border: '2px dashed rgba(120,110,95,0.25)',
            minHeight: 100,
          }}
        >
          <div className="text-[12px] text-[#6a6050] font-serif text-center">
            Add new issue...
          </div>
        </div>
      </div>

      <ModalOverlay
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        maxWidth="480px"
      >
        {selectedIssue && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-[18px] text-[#e8e0d4]">
                {selectedIssue.label}
              </h3>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-[#6a6050] hover:text-[#d4ccc0] text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            <p className="text-[13px] text-[#8a8070] mb-4">
              {selectedIssue.paperCount} papers in this issue
            </p>
            {selectedIssue.papers && selectedIssue.papers.length > 0 ? (
              <ul className="space-y-2">
                {selectedIssue.papers.map((p) => (
                  <li
                    key={p.submissionId}
                    className="text-[12px] text-[#d4ccc0] font-serif py-1.5 px-3 rounded"
                    style={{ background: 'rgba(30,28,24,0.5)' }}
                  >
                    {p.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-[#6a6050] italic">
                No papers assigned yet.
              </p>
            )}
          </>
        )}
      </ModalOverlay>

      <ModalOverlay
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        maxWidth="384px"
      >
        <h3 className="font-serif text-[16px] text-[#e8e0d4] mb-4">
          New Issue
        </h3>
        <input
          type="text"
          value={newIssueLabel}
          onChange={(e) => setNewIssueLabel(e.target.value)}
          placeholder="Issue label (e.g. Issue #3)"
          className="w-full rounded-[6px] px-3 py-2 text-[13px] font-serif text-[#d4ccc0] outline-none mb-3"
          style={{
            background: 'rgba(30,28,24,0.8)',
            border: '1px solid rgba(120,110,95,0.25)',
          }}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setShowAddForm(false);
              setNewIssueLabel('');
            }}
            className="px-4 py-1.5 rounded text-[12px] font-serif cursor-pointer"
            style={{
              color: '#8a8070',
              border: '1px solid rgba(120,110,95,0.25)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !newIssueLabel.trim()}
            className="px-4 py-1.5 rounded text-[12px] font-serif cursor-pointer"
            style={{
              background:
                'linear-gradient(135deg, rgba(180,160,120,0.2), rgba(160,140,100,0.1))',
              border: '1px solid rgba(180,160,120,0.4)',
              color: '#d4c8a8',
            }}
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </ModalOverlay>
    </div>
  );
}
