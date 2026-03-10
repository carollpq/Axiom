'use client';

import { useState, useCallback } from 'react';
import { FormInput } from '@/src/shared/components/form-input.client';
import { SectionLabel } from '@/src/shared/components/section-label';
import { Button } from '@/src/shared/components/button.client';
import { publishCriteriaAction } from '@/src/features/submissions/actions';

export interface ReviewCriterionInput {
  id: string;
  label: string;
  evaluationType: 'yes_no_partially' | 'scale_1_5';
  description?: string;
  required: boolean;
}

interface CriteriaBuilderProps {
  submissionId: string;
  onPublished?: (criteriaHash: string, hederaTxId?: string) => void;
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
  onPublished,
}: CriteriaBuilderProps) {
  const [criteria, setCriteria] = useState<ReviewCriterionInput[]>([
    newCriterion(),
  ]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);
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
      onPublished?.(result.criteriaHash, result.hederaTxId);
    } catch {
      setError('Network error — please try again');
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
            style={{
              background: 'rgba(30,28,24,0.6)',
              border: '1px solid rgba(120,110,95,0.15)',
            }}
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
              <select
                value={c.evaluationType}
                onChange={(e) =>
                  updateCriterion(c.id, {
                    evaluationType: e.target
                      .value as ReviewCriterionInput['evaluationType'],
                  })
                }
                className="rounded text-[11px] font-serif text-[#d4ccc0] outline-none"
                style={{
                  padding: '4px 8px',
                  background: 'rgba(30,28,24,0.8)',
                  border: '1px solid rgba(120,110,95,0.25)',
                }}
              >
                <option value="yes_no_partially">Yes / No / Partially</option>
                <option value="scale_1_5">Scale 1–5</option>
              </select>
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
