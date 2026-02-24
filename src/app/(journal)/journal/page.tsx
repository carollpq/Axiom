"use client";

import { useJournalDashboard } from "@/src/shared/hooks/useJournalDashboard";
import {
  StatsRow,
  PipelineSummary,
  FilterBar,
  SubmissionsTable,
  KanbanBoard,
  DetailPanel,
} from "@/components/journal-dashboard";
import {
  pipelineStages,
  stages,
  mockReviewerPool,
  mockCriteria,
} from "@/lib/mock-data/journal-dashboard";

export default function JournalDashboard() {
  const {
    filter,
    setFilter,
    hoveredRow,
    setHoveredRow,
    selectedSubmission,
    detailTab,
    setDetailTab,
    searchReviewer,
    setSearchReviewer,
    viewMode,
    setViewMode,
    filtered,
    selected,
    pipelineCounts,
    filteredReviewers,
    stats,
    selectSubmission,
    toggleFilter,
    clearSelection,
    stageColors,
    submissions,
  } = useJournalDashboard();

  return (
    <div className="max-w-[1280px] mx-auto px-10 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-normal italic text-[#e8e0d4] m-0">
          Journal Dashboard
        </h1>
        <p className="text-[13px] text-[#6a6050] mt-1.5 italic">
          Manage submissions, review criteria, and publication decisions
        </p>
      </div>

      <StatsRow stats={stats} />

      <PipelineSummary
        pipelineCounts={pipelineCounts}
        stages={pipelineStages}
        stageColors={stageColors}
        activeFilter={filter}
        onToggleFilter={toggleFilter}
      />

      <FilterBar
        stages={stages}
        activeFilter={filter}
        onFilterChange={setFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex gap-6">
        <div style={{ flex: selectedSubmission ? 1.2 : 1, minWidth: 0 }}>
          {viewMode === "table" ? (
            <SubmissionsTable
              submissions={filtered}
              stageColors={stageColors}
              selectedId={selectedSubmission}
              hoveredRow={hoveredRow}
              onSelectSubmission={selectSubmission}
              onHoverRow={setHoveredRow}
            />
          ) : (
            <KanbanBoard
              submissions={submissions}
              stages={pipelineStages}
              stageColors={stageColors}
              selectedId={selectedSubmission}
              onSelectSubmission={selectSubmission}
            />
          )}
        </div>

        {selected && (
          <DetailPanel
            submission={selected}
            stageColors={stageColors}
            detailTab={detailTab}
            onTabChange={setDetailTab}
            onClose={clearSelection}
            criteria={mockCriteria}
            reviewerPool={mockReviewerPool}
            filteredReviewers={filteredReviewers}
            searchReviewer={searchReviewer}
            onSearchChange={setSearchReviewer}
          />
        )}
      </div>
    </div>
  );
}
