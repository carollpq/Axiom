"use client";

import Link from "next/link";
import { DashboardHeader } from "@/src/shared/components";
import { StatCard } from "@/src/shared/components/StatCard";
import { EditorProfileCard } from "./EditorProfileCard";
import type { StatCardProps } from "@/src/shared/types/shared";
import type { EditorProfile } from "@/src/features/editor/types";

interface DashboardOverviewProps {
  stats: StatCardProps[];
  editorProfile: EditorProfile;
}

export function DashboardOverview({ stats, editorProfile }: DashboardOverviewProps) {
  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      <DashboardHeader role="editor" />

      <div className="flex gap-8 mb-8">
        {/* Performance Metrics */}
        <div className="flex-1">
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-4">
            Performance Metrics
          </div>
          <div className="flex gap-4 flex-wrap">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </div>

        {/* Editor Profile */}
        <div className="w-[260px] shrink-0">
          <EditorProfileCard editor={editorProfile} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-8">
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
    </div>
  );
}
