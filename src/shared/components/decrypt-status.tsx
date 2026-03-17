'use client';

import { Button } from './button.client';

interface DecryptLoadingProps {
  message?: string;
}

export function DecryptLoading({
  message = 'Decrypting paper…',
}: DecryptLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div
        className="animate-spin rounded-full"
        style={{
          width: 32,
          height: 32,
          border: '3px solid rgba(120,110,95,0.2)',
          borderTopColor: '#c9a44a',
        }}
      />
      <span className="font-serif text-[13px] text-[#8a8070]">{message}</span>
    </div>
  );
}

interface DecryptErrorProps {
  error?: string | null;
  onRetry: () => void;
}

export function DecryptError({
  error = 'Unknown error',
  onRetry,
}: DecryptErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#d4645a"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span className="font-serif text-[13px] text-[#d4645a]">
        Decryption failed
      </span>
      <span className="font-serif text-[11px] text-[#6a6050] text-center max-w-[260px]">
        {error}
      </span>
      <Button variant="gold" onClick={onRetry} className="mt-2">
        Retry
      </Button>
    </div>
  );
}
