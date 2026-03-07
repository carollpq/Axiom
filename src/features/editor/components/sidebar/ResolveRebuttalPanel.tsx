"use client";

import { useState } from "react";
import type { RebuttalResolutionDb } from "@/src/shared/lib/db/schema";
import { Button } from "@/src/shared/components/Button";
import { FormTextarea } from "@/src/shared/components/FormTextarea";
import { FormSelect } from "@/src/shared/components/FormSelect";
import { SidebarSection } from "@/src/shared/components/SidebarSection";
import { SectionLabel } from "@/src/shared/components/SectionLabel";
import { ListRow } from "@/src/shared/components/ListRow";

interface RebuttalResponseView {
  reviewId: string;
  reviewerLabel: string;
  position: "agree" | "disagree";
  justification: string;
}

interface ResolveRebuttalPanelProps {
  responses: RebuttalResponseView[];
  rebuttalId: string;
  onResolve: (resolution: RebuttalResolutionDb, notes: string) => void;
  isResolving: boolean;
}

const positionColors = {
  agree: { bg: "rgba(120,180,120,0.15)", text: "#8fbc8f", border: "rgba(120,180,120,0.3)" },
  disagree: { bg: "rgba(200,100,90,0.15)", text: "#d4645a", border: "rgba(200,100,90,0.3)" },
};

export function ResolveRebuttalPanel({
  responses,
  rebuttalId,
  onResolve,
  isResolving,
}: ResolveRebuttalPanelProps) {
  const [resolution, setResolution] = useState<RebuttalResolutionDb | "">("");
  const [notes, setNotes] = useState("");

  return (
    <SidebarSection title="Rebuttal Responses">
      <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
        {responses.map((r) => {
          const c = positionColors[r.position];
          return (
            <ListRow key={`${r.reviewId}-${r.position}`} className="block p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[#b0a898] font-serif">
                  Re: {r.reviewerLabel}
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-sm"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
                >
                  {r.position === "agree" ? "Agrees" : "Disagrees"}
                </span>
              </div>
              <p className="text-[11px] text-[#8a8070] font-serif leading-relaxed">
                {r.justification}
              </p>
            </ListRow>
          );
        })}
      </div>

      <SectionLabel className="mb-2">Resolution</SectionLabel>

      <FormSelect
        value={resolution}
        onChange={(e) => setResolution(e.target.value as RebuttalResolutionDb | "")}
        className="w-full mb-2"
      >
        <option value="">Select resolution...</option>
        <option value="upheld">Upheld (reviewer was wrong)</option>
        <option value="rejected">Rejected (reviewer was right)</option>
        <option value="partial">Partial</option>
      </FormSelect>

      <FormTextarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Editor notes on resolution..."
        rows={3}
        className="mb-3"
      />

      <Button
        variant="gold"
        fullWidth
        onClick={() => { if (resolution) onResolve(resolution, notes); }}
        disabled={!resolution || isResolving}
      >
        {isResolving ? "Resolving..." : "Resolve Rebuttal"}
      </Button>
    </SidebarSection>
  );
}
