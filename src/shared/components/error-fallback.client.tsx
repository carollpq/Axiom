'use client';

import { useEffect } from 'react';
import { Button } from '@/src/shared/components/button.client';

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  label?: string;
}

export function ErrorFallback({
  error,
  reset,
  label = 'route',
}: ErrorFallbackProps) {
  useEffect(() => {
    console.error(`[${label} error]`, error);
  }, [error, label]);

  return (
    <div className="max-w-md mx-auto py-20 px-6 text-center font-serif">
      <div className="text-[#d4645a] text-lg mb-2">Something went wrong</div>
      <p className="text-[#8a8070] text-sm mb-6">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <Button variant="gold" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
