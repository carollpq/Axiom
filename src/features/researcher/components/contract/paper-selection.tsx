import type { ExistingDraft } from '@/src/features/researcher/types/contract';

interface PaperSelectionProps {
  selectedDraft: number | null;
  drafts: ExistingDraft[];
  draft: ExistingDraft | undefined;
  disabled?: boolean;
  onSelectDraft: (id: number | null) => void;
}

export function PaperSelection({
  selectedDraft,
  drafts,
  draft,
  disabled,
  onSelectDraft,
}: PaperSelectionProps) {
  return (
    <div
      className="rounded-lg p-6 mt-7 mb-6"
      style={{
        background: 'rgba(45,42,38,0.5)',
        border: '1px solid rgba(120,110,95,0.2)',
      }}
    >
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3">
        Paper Selection
      </div>
      <div>
        <div className="text-[11px] text-[#8a8070] mb-1.5">
          Select a registered paper
        </div>
        <select
          value={selectedDraft || ''}
          onChange={(e) => {
            onSelectDraft(e.target.value ? Number(e.target.value) : null);
          }}
          disabled={disabled}
          className="w-full py-2.5 px-3 rounded text-[#d4ccc0] font-serif text-[13px] outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(30,28,24,0.8)',
            border: '1px solid rgba(120,110,95,0.25)',
            appearance: 'none',
          }}
        >
          <option value="">-- Choose a paper --</option>
          {drafts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
              {d.registered ? ' \u2713 Registered' : ''}
            </option>
          ))}
        </select>
      </div>
      {draft && (
        <div className="mt-3 text-[11px] flex items-center gap-2">
          {draft.registered ? (
            <span className="text-[#8fbc8f]">
              Paper registered and verified on-chain
            </span>
          ) : (
            <span className="text-[#c9a44a]">
              Paper not yet registered — upload it on the Paper Version Control
              page first
            </span>
          )}
        </div>
      )}
    </div>
  );
}
