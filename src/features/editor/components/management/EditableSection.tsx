"use client";

import { useState } from "react";

interface EditableSectionProps {
  title: string;
  initialValue: string;
}

export function EditableSection({ title, initialValue }: EditableSectionProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  return (
    <div className="mb-8">
      <div className="text-sm text-[#d4ccc0] font-serif mb-3">{title}</div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        readOnly={!editing}
        rows={5}
        className="w-full rounded-[6px] p-4 text-[13px] font-serif text-[#d4ccc0] outline-none resize-none"
        style={{
          background: editing ? "rgba(30,28,24,0.8)" : "rgba(45,42,38,0.5)",
          border: `1px solid ${editing ? "rgba(180,160,120,0.4)" : "rgba(120,110,95,0.2)"}`,
          cursor: editing ? "text" : "default",
        }}
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={() => setEditing(!editing)}
          className="px-5 py-2 rounded text-[13px] font-serif cursor-pointer"
          style={{
            background: editing
              ? "linear-gradient(135deg, rgba(120,180,120,0.25), rgba(100,160,100,0.15))"
              : "linear-gradient(135deg, rgba(180,160,120,0.25), rgba(160,140,100,0.15))",
            border: `1px solid ${editing ? "rgba(120,180,120,0.4)" : "rgba(180,160,120,0.4)"}`,
            color: editing ? "#8fbc8f" : "#d4c8a8",
          }}
        >
          {editing ? "Save" : "Edit"}
        </button>
      </div>
    </div>
  );
}
