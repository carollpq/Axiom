import type { ContractWithStatus } from '@/src/features/researcher/types/contract';
import { HashScanLink } from '@/src/shared/components/hashscan-link';

const onChainBadgeStyle = {
  color: '#5a7a9a',
  background: 'rgba(90,122,154,0.1)',
  border: '1px solid rgba(90,122,154,0.2)',
  letterSpacing: 0.5,
} as const;

interface Props {
  contracts: ContractWithStatus[];
}

export function ContractsStatus({ contracts }: Props) {
  if (contracts.length === 0) {
    return (
      <div
        className="rounded-md px-6 py-10 text-center text-[13px] text-[#6a6050]"
        style={{
          background: 'rgba(45,42,38,0.4)',
          border: '1px solid rgba(120,110,95,0.15)',
        }}
      >
        You haven&apos;t created any contracts yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {contracts.map((contract) => (
        <div
          key={contract.id}
          className="rounded-md p-5"
          style={{
            background: 'rgba(45,42,38,0.5)',
            border: '1px solid rgba(120,110,95,0.2)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-[15px] font-serif text-[#e8e0d4] mb-2">
                {contract.paperTitle}
              </h3>
              <div className="flex flex-col gap-1">
                {contract.contributors.map((c, idx) => (
                  <p key={idx} className="text-[12px] text-[#8a8070]">
                    {c.name} &mdash; {c.role} &mdash; {c.pct}%
                  </p>
                ))}
              </div>
              {contract.hederaTxId && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span
                    className="text-[8px] uppercase px-1 py-px rounded-sm"
                    style={onChainBadgeStyle}
                  >
                    On-chain
                  </span>
                  <HashScanLink txId={contract.hederaTxId} />
                </div>
              )}
            </div>
            <div className="shrink-0">
              {contract.allSigned ? (
                <span
                  className="inline-block px-3 py-1.5 rounded text-[11px] font-medium"
                  style={{
                    background: 'rgba(143,188,143,0.2)',
                    color: '#8fbc8f',
                    border: '1px solid rgba(143,188,143,0.3)',
                  }}
                >
                  Contract Validated
                </span>
              ) : (
                <span
                  className="inline-block px-3 py-1.5 rounded text-[11px] font-medium"
                  style={{
                    background: 'rgba(201,164,74,0.15)',
                    color: '#c9a44a',
                    border: '1px solid rgba(201,164,74,0.3)',
                  }}
                >
                  {contract.pendingCount} Author Signature
                  {contract.pendingCount !== 1 ? 's' : ''} Pending
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
