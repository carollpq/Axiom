'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/src/shared/lib/errors';

interface EditableSectionProps {
  title: string;
  initialValue: string;
  onSave?: (value: string) => Promise<void>;
}

export function EditableSection({
  title,
  initialValue,
  onSave,
}: EditableSectionProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  const handleClick = async () => {
    if (editing && onSave) {
      setSaving(true);
      try {
        await onSave(value);
      } catch (err) {
        const message = getErrorMessage(err, 'Save failed');
        toast.error(message);
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    setEditing(!editing);
  };

  return (
    <div
      className="rounded-[8px] p-[22px] mb-6"
      style={{
        background: 'rgba(45,42,38,0.5)',
        border: '1px solid rgba(120,110,95,0.15)',
      }}
    >
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-4">
        {title}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        readOnly={!editing}
        rows={5}
        className="w-full rounded-[6px] p-4 text-[13px] font-serif text-[#d4ccc0] outline-none resize-none"
        style={{
          background: editing ? 'rgba(30,28,24,0.8)' : 'rgba(30,28,24,0.4)',
          border: `1px solid ${editing ? 'rgba(180,160,120,0.4)' : 'rgba(120,110,95,0.15)'}`,
          cursor: editing ? 'text' : 'default',
        }}
      />
      <div className="flex justify-end mt-3">
        <button
          onClick={handleClick}
          disabled={saving}
          className="px-5 py-2 rounded-[5px] text-[13px] font-serif cursor-pointer"
          style={{
            background: editing
              ? 'linear-gradient(135deg, rgba(120,180,120,0.25), rgba(100,160,100,0.15))'
              : 'linear-gradient(135deg, rgba(180,160,120,0.2), rgba(160,140,100,0.1))',
            border: `1px solid ${editing ? 'rgba(120,180,120,0.4)' : 'rgba(180,160,120,0.4)'}`,
            color: editing ? '#8fbc8f' : '#d4c8a8',
          }}
        >
          {saving ? 'Saving...' : editing ? 'Save' : 'Edit'}
        </button>
      </div>
    </div>
  );
}
