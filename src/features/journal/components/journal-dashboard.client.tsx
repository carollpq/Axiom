"use client";

import { useJournalDashboard } from "@/src/shared/hooks/useJournalDashboard";
import { DashboardHeader } from "@/src/shared/components";
import {
  StatsRow,
  PipelineSummary,
  FilterBar,
  SubmissionsTable,
  KanbanBoard,
  DetailPanel,
} from "@/src/features/journal";
import { pipelineStages, stages, reviewCriteria } from "@/src/features/journal/constants";
import type { JournalSubmission, PoolReviewer } from "@/src/shared/types/journal-dashboard";

interface Props {
  initialSubmissions: JournalSubmission[];
  initialReviewerPool: PoolReviewer[];
}

export function JournalDashboardClient({ initialSubmissions, initialReviewerPool }: Props) {
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
  } = useJournalDashboard(initialSubmissions, initialReviewerPool);

  return (
    <div className="max-w-[1280px] mx-auto px-10 py-8">
      <DashboardHeader role="journal" />

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
            criteria={reviewCriteria}
            reviewerPool={initialReviewerPool}
            filteredReviewers={filteredReviewers}
            searchReviewer={searchReviewer}
            onSearchChange={setSearchReviewer}
          />
        )}
      </div>
    </div>
  );
}
