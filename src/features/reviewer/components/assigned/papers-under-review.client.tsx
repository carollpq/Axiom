"use client";

import { useState, useMemo } from "react";
import { ThreeColumnLayout } from "@/src/shared/components/ThreeColumnLayout";
import { SelectionPlaceholder } from "@/src/shared/components/SelectionPlaceholder";
import { PaperList } from "@/src/shared/components/PaperList";
import { DynamicPdfViewer } from "@/src/shared/components/DynamicPdfViewer";
import { useCollapseSidebar } from "@/src/shared/hooks/useCollapseSidebar";
import type { AssignedReviewExtended } from "@/src/features/reviewer/types";
import { toReviewerPaperListItems } from "@/src/features/reviewer/mappers/dashboard";
import { AssignedReviewSidebar } from "./assigned-review-sidebar";

interface Props {
  initialAssigned: AssignedReviewExtended[];
}

export function PapersUnderReviewClient({ initialAssigned }: Props) {
  useCollapseSidebar();
  const [selectedId, setSelectedId] = useState<string | null>(
    initialAssigned.length > 0 ? String(initialAssigned[0].id) : null,
  );

  const paperItems = useMemo(() => toReviewerPaperListItems(initialAssigned), [initialAssigned]);
  const selected = initialAssigned.find((p) => String(p.id) === selectedId) ?? null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1816" }}>
      <ThreeColumnLayout
        title="Papers Under Review"
        countLabel={`${initialAssigned.length} paper${initialAssigned.length !== 1 ? "s" : ""}`}
        list={
          <PaperList
            papers={paperItems}
            selectedId={selectedId}
            onSelect={setSelectedId}
            emptyMessage="No papers under review."
          />
        }
        viewer={
          selected?.pdfUrl ? (
            <DynamicPdfViewer fileUrl={selected.pdfUrl} />
          ) : (
            <SelectionPlaceholder message={selected ? "No PDF available" : "Select a paper to view"} />
          )
        }
        sidebar={
          selected ? (
            <AssignedReviewSidebar paper={selected} />
          ) : (
            <div className="p-4 text-[12px] text-[#6a6050]">
              Select a paper to see details
            </div>
          )
        }
        sidebarTitle="Review Details"
      />
    </div>
  );
}
