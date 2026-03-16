import { HEDERA_NETWORK } from '@/src/shared/lib/hedera/network';
import { truncate } from '@/src/shared/lib/format';

interface HashScanLinkProps {
  txId: string;
}

export function HashScanLink({ txId }: HashScanLinkProps) {
  return (
    <a
      href={`https://hashscan.io/${HEDERA_NETWORK}/transaction/${txId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs font-mono hover:underline"
      style={{ color: '#5a7a9a' }}
      title={txId}
    >
      {truncate(txId, 10, 8)}
    </a>
  );
}
