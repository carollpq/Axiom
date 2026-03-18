import type { SubmissionResult } from '@/src/features/reviewer/types/workspace';
import { HashScanLink } from '@/src/shared/components/hashscan-link';
import { truncate } from '@/src/shared/lib/format';

interface SubmissionConfirmationProps {
  result: SubmissionResult;
}

const cardStyle = {
  background: 'rgba(30,28,24,0.5)',
  border: '1px solid rgba(120,110,95,0.12)',
} as const;

const containerStyle = {
  background: 'linear-gradient(145deg, rgba(45,42,38,0.9), rgba(35,32,28,0.9))',
  border: '1px solid rgba(120,110,95,0.25)',
} as const;

const criteriaSectionStyle = {
  background: 'rgba(30,28,24,0.5)',
  border: '1px solid rgba(120,110,95,0.1)',
} as const;

type SubmissionHashKey = 'txHash' | 'paperHash' | 'reviewHash';

const GUARANTEES: ReadonlyArray<{
  icon: string;
  title: string;
  description: string;
  hashKey: SubmissionHashKey;
  hashLabel: string;
}> = [
  {
    icon: '#',
    title: 'Paper integrity verified',
    description:
      'A unique fingerprint of the paper was recorded on-chain. Any future changes to the file would produce a different fingerprint, proving the original was preserved.',
    hashKey: 'paperHash',
    hashLabel: 'Paper fingerprint',
  },
  {
    icon: '\u{25C9}',
    title: 'Review permanently recorded',
    description:
      'Your evaluation \u2014 criteria ratings, comments, and recommendation \u2014 was hashed and anchored to Hedera. It cannot be altered or deleted by anyone.',
    hashKey: 'reviewHash',
    hashLabel: 'Review fingerprint',
  },
  {
    icon: '\u{29BB}',
    title: 'Publicly verifiable on Hedera',
    description:
      'The transaction is recorded on the Hedera Consensus Service. Anyone can independently verify this record using the link below.',
    hashKey: 'txHash',
    hashLabel: 'Hedera transaction',
  },
];

const TECHNICAL_ROWS: ReadonlyArray<{
  label: string;
  key: keyof SubmissionResult;
  mono: boolean;
}> = [
  { label: 'Transaction ID', key: 'txHash', mono: true },
  { label: 'Paper Hash (SHA-256)', key: 'paperHash', mono: true },
  { label: 'Review Hash (SHA-256)', key: 'reviewHash', mono: true },
  { label: 'Timestamp', key: 'timestamp', mono: false },
];

export function SubmissionConfirmation({
  result,
}: SubmissionConfirmationProps) {
  const { met, partial, notMet } = result.criteriaSummary;

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="rounded-lg p-8 text-center" style={containerStyle}>
        {/* Hero */}
        <div className="text-4xl mb-4" style={{ color: '#8fbc8f' }}>
          {'\u2713'}
        </div>
        <h2
          className="text-xl font-serif font-normal m-0 mb-2"
          style={{ color: '#e8e0d4' }}
        >
          Review Submitted Successfully
        </h2>
        <p className="text-sm mb-8" style={{ color: '#8a8070' }}>
          Your review is now immutably recorded on the Hedera blockchain
        </p>

        {/* Guarantee cards */}
        <div className="flex flex-col gap-3 text-left mb-8">
          {GUARANTEES.map((g) => {
            const hashValue = result[g.hashKey];
            return (
              <div key={g.hashKey} className="rounded-md p-4" style={cardStyle}>
                <div className="flex items-start gap-3">
                  <span className="text-lg leading-none mt-0.5">{g.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-serif mb-1"
                      style={{ color: '#d4ccc0' }}
                    >
                      {g.title}
                    </div>
                    <p
                      className="text-xs leading-relaxed m-0 mb-2"
                      style={{ color: '#8a8070' }}
                    >
                      {g.description}
                    </p>
                    {hashValue && (
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] uppercase"
                          style={{ color: '#6a6050', letterSpacing: 1 }}
                        >
                          {g.hashLabel}:
                        </span>
                        {g.hashKey === 'txHash' ? (
                          <HashScanLink txId={hashValue} />
                        ) : (
                          <span
                            className="text-xs font-mono"
                            style={{ color: '#5a7a9a' }}
                            title={hashValue}
                          >
                            {truncate(hashValue, 10, 8)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timestamp */}
        <div
          className="flex items-center justify-center gap-2 mb-6 text-xs"
          style={{ color: '#6a6050' }}
        >
          <span>Recorded at</span>
          <span style={{ color: '#b0a898' }}>{result.timestamp}</span>
        </div>

        {/* Technical details — pure HTML toggle, no client JS needed */}
        <details className="mb-6 text-left">
          <summary
            className="text-xs font-serif cursor-pointer text-center list-none"
            style={{ color: '#5a7a9a' }}
          >
            View full technical details &#9660;
          </summary>
          <div className="flex flex-col gap-2 mt-3">
            {TECHNICAL_ROWS.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-4 py-2.5 rounded"
                style={cardStyle}
              >
                <span className="text-[10px]" style={{ color: '#6a6050' }}>
                  {row.label}
                </span>
                <span
                  className="text-[10px] truncate max-w-[60%] text-right"
                  style={{
                    color: '#c9b89e',
                    fontFamily: row.mono ? 'monospace' : 'inherit',
                  }}
                  title={String(result[row.key])}
                >
                  {String(result[row.key])}
                </span>
              </div>
            ))}
          </div>
        </details>

        {/* Criteria Summary */}
        <div className="rounded-md p-5" style={criteriaSectionStyle}>
          <div
            className="text-xs uppercase mb-3"
            style={{ color: '#6a6050', letterSpacing: 1.5 }}
          >
            Criteria Summary
          </div>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-serif" style={{ color: '#8fbc8f' }}>
                {met}
              </div>
              <div className="text-xs" style={{ color: '#6a6050' }}>
                Met
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-serif" style={{ color: '#d4a45a' }}>
                {partial}
              </div>
              <div className="text-xs" style={{ color: '#6a6050' }}>
                Partial
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-serif" style={{ color: '#d4645a' }}>
                {notMet}
              </div>
              <div className="text-xs" style={{ color: '#6a6050' }}>
                Not Met
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
