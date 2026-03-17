'use client';

import type { GeneralComments } from '@/src/features/reviewer/types/workspace';

interface GeneralCommentsSectionProps {
  comments: GeneralComments;
  onChange: (field: keyof GeneralComments, value: string) => void;
}

const FIELDS: {
  key: keyof GeneralComments;
  label: string;
  placeholder: string;
  rows: number;
  note?: string;
  testId: string;
}[] = [
  {
    key: 'strengths',
    label: 'Strengths *',
    placeholder: 'Describe the key strengths of this work...',
    rows: 3,
    testId: 'strengths-input',
  },
  {
    key: 'weaknesses',
    label: 'Weaknesses',
    placeholder: 'Describe any weaknesses or areas for improvement...',
    rows: 3,
    testId: 'weaknesses-input',
  },
  {
    key: 'questionsForAuthors',
    label: 'Questions for Authors',
    placeholder: 'Questions or clarifications for the authors...',
    rows: 2,
    testId: 'questions-input',
  },
  {
    key: 'confidentialEditorComments',
    label: 'Confidential Comments to Editor',
    placeholder:
      'Comments visible only to the editor (not included in on-chain hash)...',
    rows: 2,
    note: 'These comments are stored off-chain only and are never included in the review hash anchored on Hedera.',
    testId: 'confidential-comments-input',
  },
];

export function GeneralCommentsSection({
  comments,
  onChange,
}: GeneralCommentsSectionProps) {
  return (
    <div className="mb-6">
      <h3
        className="text-base font-serif font-normal m-0 mb-4"
        style={{ color: '#e8e0d4' }}
      >
        General Comments
      </h3>

      <div className="flex flex-col gap-4">
        {FIELDS.map((f) => (
          <div key={f.key} data-testid={f.testId}>
            <label className="input-label">{f.label}</label>
            <textarea
              placeholder={f.placeholder}
              value={comments[f.key]}
              onChange={(e) => onChange(f.key, e.target.value)}
              rows={f.rows}
              className="input-field resize-y leading-[1.6]"
            />
            {f.note && (
              <div
                className="text-xs italic mt-1.5 px-1"
                style={{ color: '#6a6050' }}
              >
                {f.note}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
