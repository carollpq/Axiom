'use client';

import type { Recommendation } from '@/src/features/reviewer/types';
import { FormSelect } from '@/src/shared/components/form-select.client';

interface RecommendationSectionProps {
  recommendation: Recommendation | null;
  allCriteriaMet: boolean;
  onChange: (value: Recommendation) => void;
}

const OPTIONS: Recommendation[] = [
  'Accept',
  'Minor Revisions',
  'Major Revisions',
  'Reject',
];

export function RecommendationSection({
  recommendation,
  allCriteriaMet,
  onChange,
}: RecommendationSectionProps) {
  return (
    <div className="mb-6">
      <h3
        className="text-base font-serif font-normal m-0 mb-4"
        style={{ color: '#e8e0d4' }}
      >
        Recommendation
      </h3>

      {allCriteriaMet && (
        <div
          className="rounded-md px-5 py-3 mb-4 text-xs"
          style={{
            background: 'rgba(143,188,143,0.1)',
            border: '1px solid rgba(143,188,143,0.3)',
            color: '#8fbc8f',
          }}
        >
          All journal criteria are met. Any rejection must be accompanied by a
          public on-chain justification from the editor.
        </div>
      )}

      <div className="relative">
        <FormSelect
          value={recommendation ?? ''}
          onChange={(e) => onChange(e.target.value as Recommendation)}
          style={{ padding: '10px 14px', fontSize: 13 }}
        >
          <option value="" disabled>
            Select your recommendation...
          </option>
          {OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </FormSelect>
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
          style={{ color: '#6a6050' }}
        >
          {'\u25BC'}
        </span>
      </div>
    </div>
  );
}
