'use client';

import { DynamicPdfViewer } from './dynamic-pdf-viewer.client';
import { SelectionPlaceholder } from './selection-placeholder';
import { DecryptLoading, DecryptError } from './decrypt-status';
import { useDecryptPaper } from '@/src/shared/hooks/useDecryptPaper';
import { useActiveAccount } from 'thirdweb/react';

interface DecryptablePdfViewerProps {
  paperId?: string | null;
  hasLitData?: boolean;
  fallbackFileUrl?: string;
  title?: string;
}

/**
 * PDF viewer that handles Lit Protocol decryption transparently.
 * Shows loading/error/retry states when decryption is needed,
 * falls back to direct URL otherwise.
 */
export function DecryptablePdfViewer({
  paperId,
  hasLitData,
  fallbackFileUrl,
  title,
}: DecryptablePdfViewerProps) {
  const account = useActiveAccount();
  const {
    fileUrl: decryptedUrl,
    status,
    error,
    decrypt,
  } = useDecryptPaper(hasLitData && paperId ? paperId : null, true);

  if (hasLitData && paperId) {
    // No wallet connected — fall back to raw URL if available
    if (status === 'idle' && !account) {
      if (fallbackFileUrl) {
        return <DynamicPdfViewer fileUrl={fallbackFileUrl} title={title} />;
      }
      return (
        <SelectionPlaceholder message="Connect wallet to decrypt this paper" />
      );
    }
    if (status === 'loading') {
      return <DecryptLoading />;
    }
    if (status === 'error') {
      return <DecryptError error={error} onRetry={decrypt} />;
    }
    if (decryptedUrl) {
      return <DynamicPdfViewer fileUrl={decryptedUrl} title={title} />;
    }
    return <SelectionPlaceholder message="Preparing decryption…" />;
  }

  return <DynamicPdfViewer fileUrl={fallbackFileUrl} title={title} />;
}
