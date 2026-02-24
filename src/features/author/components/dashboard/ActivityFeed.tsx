"use client";

import { useState } from "react";
import type { ActivityItem } from "@/features/author/types/dashboard";

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const [visibleCount, setVisibleCount] = useState(items.length);

  const visible = items.slice(0, visibleCount);

  return (
    <div className="relative pl-6">
      {/* Timeline line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[rgba(120,110,95,0.2)]" />

      {visible.map((a, i) => (
        <div key={i} className="flex items-start gap-4 mb-5 relative">
          {/* Timeline dot */}
          <div
            className="w-3.5 h-3.5 rounded-full shrink-0 absolute -left-6 top-1"
            style={{
              background: i === 0 ? "rgba(180,160,120,0.3)" : "rgba(120,110,95,0.2)",
              border: `2px solid ${i === 0 ? "#c9b89e" : "rgba(120,110,95,0.3)"}`,
            }}
          />
          <div>
            <div className="text-[13px] text-[#b0a898] leading-[1.5]">{a.text}</div>
            <div className="text-[11px] text-[#5a5345] mt-[3px]">{a.time}</div>
          </div>
        </div>
      ))}

      <div className="pt-1">
        <button
          onClick={() => setVisibleCount((c) => c + 5)}
          className="bg-transparent border border-[rgba(120,110,95,0.2)] text-[#6a6050] px-4 py-1.5 rounded-[3px] font-serif text-xs cursor-pointer"
        >
          Load more
        </button>
      </div>
    </div>
  );
}
