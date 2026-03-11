'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { getErrorMessage } from '@/src/shared/lib/errors';
import { FormInput } from '@/src/shared/components/form-input.client';
import { ModalOverlay } from '@/src/shared/components/modal-overlay.client';

interface IssueCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateIssue: (label: string) => Promise<void>;
}

export function IssueCreateForm({
  isOpen,
  onClose,
  onCreateIssue,
}: IssueCreateFormProps) {
  const [newIssueLabel, setNewIssueLabel] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!newIssueLabel.trim()) return;
    setIsLoading(true);
    try {
      await onCreateIssue(newIssueLabel.trim());
      onClose();
      setNewIssueLabel('');
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to create issue');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setNewIssueLabel('');
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={handleClose} maxWidth="384px">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-serif text-[16px] text-[#e8e0d4]">New Issue</h3>
        <button
          onClick={handleClose}
          className="text-[#6a6050] hover:text-[#d4ccc0] text-xl cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>
      <FormInput
        type="text"
        value={newIssueLabel}
        onChange={(e) => setNewIssueLabel(e.target.value)}
        placeholder="Issue label (e.g. Vol. 1, Issue #3)"
        className="rounded-[6px] px-3 py-2 text-[13px] mb-4"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={handleClose}
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
          disabled={isLoading || !newIssueLabel.trim()}
          className="px-4 py-1.5 rounded text-[12px] font-serif cursor-pointer"
          style={{
            background:
              'linear-gradient(135deg, rgba(180,160,120,0.2), rgba(160,140,100,0.1))',
            border: '1px solid rgba(180,160,120,0.4)',
            color: '#d4c8a8',
          }}
        >
          {isLoading ? 'Creating...' : 'Create'}
        </button>
      </div>
    </ModalOverlay>
  );
}
