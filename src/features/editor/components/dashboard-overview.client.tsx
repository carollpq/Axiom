"use client";

import Link from "next/link";

export function QuickActions() {
  return (
    <div className="flex gap-3">
      <Link
        href="/editor/incoming"
        className="font-serif text-[13px] px-4 py-2 rounded-[5px] transition-colors"
        style={{
          background: "linear-gradient(135deg, rgba(180,160,120,0.2), rgba(160,140,100,0.1))",
          border: "1px solid rgba(180,160,120,0.4)",
          color: "#d4c8a8",
        }}
      >
        Review Incoming
      </Link>
      <Link
        href="/editor/under-review"
        className="font-serif text-[13px] px-4 py-2 rounded-[5px] transition-colors"
        style={{
          border: "1px solid rgba(120,110,95,0.25)",
          color: "#9a9080",
        }}
      >
        Papers Under Review
      </Link>
      <Link
        href="/editor/management"
        className="font-serif text-[13px] px-4 py-2 rounded-[5px] transition-colors"
        style={{
          border: "1px solid rgba(120,110,95,0.25)",
          color: "#9a9080",
        }}
      >
        Journal Settings
      </Link>
    </div>
  );
}
