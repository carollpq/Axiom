'use client';

import { useState, useCallback } from 'react';
import { FORM_CONTROL_STYLE } from '@/src/shared/components/form-styles';
import { FormInput } from '@/src/shared/components/form-input.client';
import { FormSelect } from '@/src/shared/components/form-select.client';
import { SectionLabel } from '@/src/shared/components/section-label';
import { Button } from '@/src/shared/components/button.client';
import { publishCriteriaAction } from '@/src/features/submissions/actions';
import { getErrorMessage } from '@/src/shared/lib/errors';
import type { ReviewCriterionInput } from '@/src/features/submissions/types';

interface CriteriaBuilderProps {
  submissionId: string;
  alreadyPublished?: boolean;
  onPublished?: (criteriaHash: string) => void;
}

function newCriterion(): ReviewCriterionInput {
  return {
    id: crypto.randomUUID(),
    label: '',
    evaluationType: 'yes_no_partially',
    required: true,
  };
}

export function CriteriaBuilder({
  submissionId,
  alreadyPublished = false,
  onPublished,
}: CriteriaBuilderProps) {
  const [criteria, setCriteria] = useState<ReviewCriterionInput[]>([
    newCriterion(),
  ]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(alreadyPublished);
  const [error, setError] = useState<string | null>(null);

  const updateCriterion = useCallback(
    (id: string, updates: Partial<ReviewCriterionInput>) => {
      setCriteria((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
    },
    [],
  );

  const addCriterion = useCallback(() => {
    setCriteria((prev) => [...prev, newCriterion()]);
  }, []);

  const removeCriterion = useCallback((id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const canPublish =
    criteria.length > 0 && criteria.every((c) => c.label.trim().length > 0);

  const handlePublish = useCallback(async () => {
    if (!canPublish) return;
    setIsPublishing(true);
    setError(null);

    try {
      const result = await publishCriteriaAction(submissionId, criteria);
      setPublished(true);
      onPublished?.(result.criteriaHash);
    } catch (err) {
      const msg = getErrorMessage(err, 'Network error — please try again');
      if (msg.includes('Criteria can only be published')) {
        setPublished(true);
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setIsPublishing(false);
    }
  }, [canPublish, criteria, submissionId, onPublished]);

  if (published) {
    return (
      <div className="px-4 py-3">
        <div
          className="rounded px-4 py-3 text-xs"
          style={{
            background: 'rgba(143,188,143,0.1)',
            border: '1px solid rgba(143,188,143,0.25)',
            color: '#8fbc8f',
          }}
        >
          Criteria published on-chain. Immutable for this submission.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <SectionLabel className="mb-3">Review Criteria</SectionLabel>

      <div className="space-y-2 mb-3">
        {criteria.map((c, idx) => (
          <div
            key={c.id}
            className="rounded px-3 py-2.5"
            style={FORM_CONTROL_STYLE}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-[#6a6050] shrink-0">
                {idx + 1}.
              </span>
              <FormInput
                type="text"
                value={c.label}
                onChange={(e) =>
                  updateCriterion(c.id, { label: e.target.value })
                }
                placeholder="Criterion label..."
              />
              <button
                onClick={() => removeCriterion(c.id)}
                disabled={criteria.length === 1}
                className="text-[#6a6050] hover:text-[#d4645a] text-sm cursor-pointer disabled:opacity-30 shrink-0"
                title="Remove criterion"
              >
                &times;
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={c.required}
                  onChange={(e) =>
                    updateCriterion(c.id, { required: e.target.checked })
                  }
                  className="cursor-pointer"
                />
                <span className="text-[11px] text-[#8a8070]">Required</span>
              </label>
              <FormSelect
                value={c.evaluationType}
                onChange={(e) =>
                  updateCriterion(c.id, {
                    evaluationType: e.target
                      .value as ReviewCriterionInput['evaluationType'],
                  })
                }
                className="text-[11px]"
                style={{ padding: '4px 8px', width: 'auto' }}
              >
                <option value="yes_no_partially">Yes / No / Partially</option>
                <option value="scale_1_5">Scale 1–5</option>
              </FormSelect>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addCriterion}
        className="w-full text-[11px] py-2 rounded cursor-pointer font-serif mb-3"
        style={{
          background: 'transparent',
          border: '1px dashed rgba(120,110,95,0.3)',
          color: '#8a8070',
        }}
      >
        + Add criterion
      </button>

      {error && <div className="text-[11px] text-[#d4645a] mb-2">{error}</div>}

      <Button
        variant="gold"
        fullWidth
        onClick={handlePublish}
        disabled={!canPublish || isPublishing}
        className="py-2.5"
      >
        {isPublishing ? 'Publishing to HCS...' : 'Publish Criteria On-Chain'}
      </Button>

      <p className="text-[10px] mt-2" style={{ color: '#4a4238' }}>
        Once published, criteria are immutable for this submission.
      </p>
    </div>
  );
}
