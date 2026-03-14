'use client';

import { ErrorFallback } from '@/src/shared/components/error-fallback.client';

export default function ReviewerError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback {...props} label="Reviewer route" />;
}
