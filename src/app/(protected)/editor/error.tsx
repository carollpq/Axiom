'use client';

import { ErrorFallback } from '@/src/shared/components/error-fallback.client';

export default function EditorError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback {...props} label="Editor route" />;
}
