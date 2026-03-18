'use client';

import { useState } from 'react';
import { ModalOverlay } from '@/src/shared/components/modal-overlay.client';
import { Button } from '@/src/shared/components/button.client';
import { FormSelect } from '@/src/shared/components/form-select.client';
import type { JournalIssue } from '@/src/features/editor/types';

interface PublishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (issueId?: string) => Promise<void>;
  paperTitle: string;
  issues: JournalIssue[];
  isPublishing: boolean;
}

export function PublishDialog({
  isOpen,
  onClose,
  onPublish,
  paperTitle,
  issues,
  isPublishing,
}: PublishDialogProps) {
  const [selectedIssue, setSelectedIssue] = useState('');

  const handleConfirm = () => {
    onPublish(selectedIssue || undefined);
  };

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={isPublishing ? () => {} : onClose}
      maxWidth="480px"
    >
      <h3 className="text-[15px] font-serif text-[#d4ccc0] mb-1">
        Publish Paper
      </h3>
      <p className="text-[12px] text-[#6a6050] mb-4 leading-relaxed">
        This will make the paper publicly available and mint reputation tokens
        for all reviewers.
      </p>

      <div
        className="rounded-[6px] p-3 mb-4"
        style={{
          background: 'rgba(30,28,25,0.6)',
          border: '1px solid rgba(120,110,95,0.15)',
        }}
      >
        <div className="text-[11px] text-[#6a6050] mb-1">Paper</div>
        <div className="text-[13px] font-serif text-[#d4ccc0] leading-snug">
          {paperTitle}
        </div>
      </div>

      {issues.length > 0 && (
        <div className="mb-5">
          <label className="block text-[12px] text-[#8a8070] mb-1.5 font-serif">
            Assign to issue <span className="text-[#6a6050]">(optional)</span>
          </label>
          <FormSelect
            value={selectedIssue}
            onChange={(e) => setSelectedIssue(e.target.value)}
            className="w-full"
            style={{ padding: '8px 12px' }}
          >
            <option value="">No issue</option>
            {issues.map((issue) => (
              <option key={issue.id} value={issue.id}>
                {issue.label}
              </option>
            ))}
          </FormSelect>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={isPublishing}>
          Cancel
        </Button>
        <Button variant="gold" onClick={handleConfirm} disabled={isPublishing}>
          {isPublishing ? 'Publishing...' : 'Publish'}
        </Button>
      </div>
    </ModalOverlay>
  );
}
