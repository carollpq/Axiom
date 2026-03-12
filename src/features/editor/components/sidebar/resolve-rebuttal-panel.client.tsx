'use client';

import { useState } from 'react';
import type { RebuttalResolutionDb } from '@/src/shared/lib/db/schema';
import { getStatusColors } from '@/src/shared/lib/status-colors';
import { Button } from '@/src/shared/components/button.client';
import { FormTextarea } from '@/src/shared/components/form-textarea.client';
import { FormSelect } from '@/src/shared/components/form-select.client';
import { SidebarSection } from '@/src/shared/components/sidebar-section';
import { SectionLabel } from '@/src/shared/components/section-label';
import { ListRow } from '@/src/shared/components/list-row';

interface RebuttalResponseView {
  reviewId: string;
  reviewerLabel: string;
  position: 'agree' | 'disagree';
  justification: string;
}

interface ResolveRebuttalPanelProps {
  responses: RebuttalResponseView[];
  rebuttalId: string;
  onResolve: (resolution: RebuttalResolutionDb, notes: string) => void;
  isResolving: boolean;
}

export function ResolveRebuttalPanel({
  responses,
  rebuttalId,
  onResolve,
  isResolving,
}: ResolveRebuttalPanelProps) {
  const [resolution, setResolution] = useState<RebuttalResolutionDb | ''>('');
  const [notes, setNotes] = useState('');

  return (
    <SidebarSection title="Rebuttal Responses">
      <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
        {responses.map((r) => {
          const c = getStatusColors(
            r.position === 'agree' ? 'Agree' : 'Disagree',
          );
          return (
            <ListRow key={`${r.reviewId}-${r.position}`} className="block p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[#b0a898] font-serif">
                  Re: {r.reviewerLabel}
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-sm"
                  style={{
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    color: c.text,
                  }}
                >
                  {r.position === 'agree' ? 'Agrees' : 'Disagrees'}
                </span>
              </div>
              <p className="text-[11px] text-[#8a8070] font-serif leading-relaxed">
                {r.justification}
              </p>
            </ListRow>
          );
        })}
      </div>

      <SectionLabel className="mb-2">Resolution</SectionLabel>

      <FormSelect
        value={resolution}
        onChange={(e) =>
          setResolution(e.target.value as RebuttalResolutionDb | '')
        }
        className="w-full mb-2"
      >
        <option value="">Select resolution...</option>
        <option value="upheld">Upheld (reviewer was wrong)</option>
        <option value="rejected">Rejected (reviewer was right)</option>
        <option value="partial">Partial</option>
      </FormSelect>

      <FormTextarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Editor notes on resolution..."
        rows={3}
        className="mb-3"
      />

      <Button
        variant="gold"
        fullWidth
        onClick={() => {
          if (resolution) onResolve(resolution, notes);
        }}
        disabled={!resolution || isResolving}
      >
        {isResolving ? 'Resolving...' : 'Resolve Rebuttal'}
      </Button>
    </SidebarSection>
  );
}
