'use client';

import { DynamicPdfViewer } from './dynamic-pdf-viewer.client';
import { SelectionPlaceholder } from './selection-placeholder';
import { DecryptLoading, DecryptError } from './decrypt-status';
import { useDecryptPaper } from '@/src/shared/hooks/useDecryptPaper';

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
  const {
    fileUrl: decryptedUrl,
    status,
    error,
    decrypt,
  } = useDecryptPaper(hasLitData && paperId ? paperId : null, true);

  if (hasLitData && paperId) {
    if (status === 'loading' || status === 'idle') {
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
