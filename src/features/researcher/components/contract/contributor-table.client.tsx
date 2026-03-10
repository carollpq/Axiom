'use client';

import { CurrentUserContributorRow } from './current-user-contributor-row.client';
import { ExternalContributorRow } from './external-contributor-row.client';
import { PercentageBar } from './percentage-bar';
import { SignatureProgress } from './signature-progress';
import { AuthorSearch } from './author-search.client';
import { useContractContext } from '@/src/features/researcher/context/contract-context.client';

export function ContributorTable() {
  const { state, actions } = useContractContext();
  const {
    contributors,
    totalPct,
    isValid,
    signedCount,
    showAddRow,
    currentUserWallet,
  } = state;

  return (
    <div
      className="rounded-lg p-6 mb-6"
      style={{
        background: 'rgba(45,42,38,0.5)',
        border: '1px solid rgba(120,110,95,0.2)',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px]">
          Contributors
        </div>
        <div className="flex items-center gap-4">
          <SignatureProgress signed={signedCount} total={contributors.length} />
          <PercentageBar />
        </div>
      </div>

      {/* Validation warning */}
      {!isValid && (
        <div
          className="py-2 px-3.5 mb-4 rounded text-[11px]"
          style={{
            background:
              totalPct > 100
                ? 'rgba(200,100,90,0.08)'
                : 'rgba(200,160,100,0.08)',
            border:
              '1px solid ' +
              (totalPct > 100
                ? 'rgba(200,100,90,0.2)'
                : 'rgba(200,160,100,0.2)'),
            color: totalPct > 100 ? '#d4645a' : '#c4956a',
          }}
        >
          {totalPct > 100
            ? 'Total exceeds 100%. Please adjust contribution percentages.'
            : 'Contributions must sum to exactly 100% before signatures can be collected.'}
        </div>
      )}

      {/* Table header */}
      <div
        className="grid py-2.5 px-3.5 rounded-t-md text-[10px] text-[#6a6050] uppercase tracking-[1.2px] gap-2"
        style={{
          gridTemplateColumns: '2fr 0.5fr 1.2fr 0.8fr 0.3fr',
          background: 'rgba(30,28,24,0.4)',
          border: '1px solid rgba(120,110,95,0.1)',
          borderBottom: 'none',
        }}
      >
        <span>Contributor</span>
        <span>%</span>
        <span>Task</span>
        <span>Signature</span>
        <span></span>
      </div>

      {/* Rows */}
      {contributors.map((c, i) => {
        const isLast = i === contributors.length - 1;
        return c.wallet === currentUserWallet ? (
          <CurrentUserContributorRow
            key={c.id}
            contributor={c}
            isLast={isLast}
          />
        ) : (
          <ExternalContributorRow key={c.id} contributor={c} isLast={isLast} />
        );
      })}

      {/* Add contributor */}
      {showAddRow ? (
        <AuthorSearch
          onSelect={actions.onAddFromSearch}
          onCancel={() => actions.onSetShowAddRow(false)}
        />
      ) : (
        <button
          onClick={() => actions.onSetShowAddRow(true)}
          disabled={state.disabled}
          className="w-full py-2.5 mt-2.5 rounded text-[#6a6050] font-serif text-xs cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'transparent',
            border: '1px dashed rgba(120,110,95,0.25)',
          }}
        >
          + Add Contributor
        </button>
      )}
    </div>
  );
}
