"use client";

import { useEffect } from "react";

export default function AuthorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Author route error]", error);
  }, [error]);

  return (
    <div className="max-w-[600px] mx-auto px-10 py-16 text-center font-serif">
      <p className="text-[32px] mb-4" aria-hidden>
        ⚠
      </p>
      <h2 className="text-[20px] font-normal italic text-[#e8e0d4] mb-3">
        Something went wrong
      </h2>
      <p className="text-[13px] text-[#8a8070] mb-8">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="px-5 py-2 rounded text-[13px] font-serif cursor-pointer"
        style={{
          background: "rgba(201,164,74,0.15)",
          border: "1px solid rgba(201,164,74,0.4)",
          color: "#c9a44a",
        }}
      >
        Try again
      </button>
    </div>
  );
}
