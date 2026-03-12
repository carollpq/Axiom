// Client error boundary for the editor section.
// Next.js renders this when an unhandled error propagates from any editor page.
'use client';

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-md mx-auto py-20 px-6 text-center">
      <div className="text-[#d4645a] font-serif text-lg mb-2">
        Something went wrong
      </div>
      <p className="text-[#8a8070] text-sm mb-6">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        className="px-5 py-2 rounded text-sm font-serif cursor-pointer"
        style={{
          background:
            'linear-gradient(135deg, rgba(180,160,120,0.25), rgba(160,140,100,0.15))',
          border: '1px solid rgba(180,160,120,0.4)',
          color: '#d4c8a8',
        }}
      >
        Try again
      </button>
    </div>
  );
}
