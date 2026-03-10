'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { getErrorMessage } from '@/src/shared/lib/errors';
// decryptFileWithLit is dynamically imported when actually needed

type DecryptStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseDecryptPaperResult {
  fileUrl: string | undefined;
  status: DecryptStatus;
  error: string | null;
  decrypt: () => void;
}

/**
 * Fetches encrypted paper content from the API, decrypts via Lit Protocol,
 * and returns a blob URL suitable for PdfViewer.
 *
 * @param paperId  - Paper ID to fetch content for (null = disabled)
 * @param autoDecrypt - If true, decrypt automatically when paperId changes
 */
export function useDecryptPaper(
  paperId: string | null,
  autoDecrypt = false,
): UseDecryptPaperResult {
  const account = useActiveAccount();
  const [status, setStatus] = useState<DecryptStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | undefined>();
  const blobUrlRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  // Reset state + revoke blob when paperId changes or on unmount
  useEffect(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setFileUrl(undefined);
    setStatus('idle');
    setError(null);
    // Invalidate any in-flight request
    requestIdRef.current += 1;

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [paperId]);

  const decrypt = useCallback(async () => {
    if (!paperId || !account) return;

    const thisRequest = ++requestIdRef.current;

    setStatus('loading');
    setError(null);

    try {
      const res = await fetch(`/api/papers/${paperId}/content`);
      if (requestIdRef.current !== thisRequest) return;

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? `HTTP ${res.status}`,
        );
      }

      const { ciphertext, dataToEncryptHash, accessConditionsJson } =
        (await res.json()) as {
          ciphertext: string;
          dataToEncryptHash: string | null;
          accessConditionsJson: string | null;
        };

      if (!dataToEncryptHash || !accessConditionsJson) {
        throw new Error('Missing Lit encryption metadata');
      }

      const conditions = JSON.parse(accessConditionsJson);
      const { decryptFileWithLit } =
        await import('@/src/shared/lib/lit/decrypt');
      const decryptedData = await decryptFileWithLit(
        ciphertext,
        dataToEncryptHash,
        conditions,
        account.address,
        (msg: string) => account.signMessage({ message: msg }),
      );

      // Stale check after long decrypt operation
      if (requestIdRef.current !== thisRequest) return;

      // Revoke previous URL before creating a new one
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }

      const blob = new Blob([decryptedData.buffer as ArrayBuffer], {
        type: 'application/pdf',
      });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setFileUrl(url);
      setStatus('success');
    } catch (err) {
      if (requestIdRef.current !== thisRequest) return;
      setError(getErrorMessage(err, 'Decryption failed'));
      setStatus('error');
    }
  }, [paperId, account]);

  // Auto-decrypt when paperId changes (if enabled)
  useEffect(() => {
    if (autoDecrypt && paperId && account && status === 'idle') {
      decrypt();
    }
  }, [autoDecrypt, paperId, account, status, decrypt]);

  return { fileUrl, status, error, decrypt };
}
