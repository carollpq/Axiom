"use client";

import { StatCard } from "@/src/shared/components/StatCard";
import { EditorProfileCard } from "./EditorProfileCard";
import type { EditorProfile } from "@/src/shared/types/editor-dashboard";
import type { StatCardProps } from "@/src/shared/types/shared";

interface DashboardOverviewProps {
  stats: StatCardProps[];
  editor: EditorProfile;
}

export function DashboardOverview({ stats, editor }: DashboardOverviewProps) {
  return (
    <div className="max-w-[1280px] mx-auto py-8 px-10">
      <div className="flex gap-8">
        {/* Left – Performance Metrics */}
        <div className="flex-1">
          <div
            className="rounded-[6px] p-6"
            style={{
              background: "linear-gradient(145deg, rgba(45,42,38,0.7), rgba(35,32,28,0.7))",
              border: "1px solid rgba(120,110,95,0.2)",
            }}
          >
            <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-5">
              Performance Metrics
            </div>
            <div className="grid grid-cols-3 gap-4">
              {stats.map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </div>
          </div>
        </div>

        {/* Right – Editor Profile */}
        <div style={{ width: 280 }}>
          <EditorProfileCard editor={editor} />
        </div>
      </div>
    </div>
  );
}
