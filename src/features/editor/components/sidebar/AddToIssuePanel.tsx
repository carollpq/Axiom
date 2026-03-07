'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { JournalIssue } from '@/src/features/editor/types';
import { FormSelect } from '@/src/shared/components/FormSelect';
import { SectionLabel } from '@/src/shared/components/SectionLabel';

interface AddToIssuePanelProps {
  issues: JournalIssue[];
  selectedIssue: string;
  onIssueChange: (v: string) => void;
  onAssign?: (issueId: string) => Promise<void>;
}

export function AddToIssuePanel({
  issues,
  selectedIssue,
  onIssueChange,
  onAssign,
}: AddToIssuePanelProps) {
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedIssue || !onAssign) return;
    setAssigning(true);
    try {
      await onAssign(selectedIssue);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to assign paper';
      toast.error(message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="p-4">
      <SectionLabel className="mb-3">Add to Issue</SectionLabel>
      {issues.length === 0 ? (
        <p className="text-[13px] text-[#6a6050] italic">
          No issues available.
        </p>
      ) : (
        <>
          <FormSelect
            value={selectedIssue}
            onChange={(e) => onIssueChange(e.target.value)}
            className="w-full"
            style={{ padding: '8px 12px' }}
          >
            <option value="">Select issue...</option>
            {issues.map((issue) => (
              <option key={issue.id} value={issue.id}>
                {issue.label}
              </option>
            ))}
          </FormSelect>
          {onAssign && selectedIssue && (
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="mt-3 w-full px-4 py-2 rounded-[5px] text-[12px] font-serif cursor-pointer"
              style={{
                background:
                  'linear-gradient(135deg, rgba(120,180,120,0.25), rgba(100,160,100,0.15))',
                border: '1px solid rgba(120,180,120,0.4)',
                color: '#8fbc8f',
              }}
            >
              {assigning ? 'Assigning...' : 'Assign to Issue'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
