import type { JournalSubmission, PoolReviewer } from "@/src/shared/types/journal-dashboard";

interface ReviewersTabProps {
  submission: JournalSubmission;
  reviewerPool: PoolReviewer[];
  filteredReviewers: PoolReviewer[];
  searchReviewer: string;
  onSearchChange: (value: string) => void;
}

export function ReviewersTab({
  submission,
  reviewerPool,
  filteredReviewers,
  searchReviewer,
  onSearchChange,
}: ReviewersTabProps) {
  if (!submission.criteriaPublished) {
    return (
      <div className="p-4 text-center text-[#6a6050] italic text-xs">
        Publish review criteria first to assign reviewers
      </div>
    );
  }

  return (
    <div>
      {/* Assigned reviewers */}
      {submission.reviewers.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-2">
            Assigned
          </div>
          {submission.reviewers.map((rid, i) => {
            const r = reviewerPool.find((x) => x.id === rid);
            if (!r) return null;
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 mb-1 rounded"
                style={{
                  background: "rgba(120,180,120,0.05)",
                  border: "1px solid rgba(120,180,120,0.1)",
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-[#8a8070]"
                  style={{ background: "rgba(120,110,95,0.2)" }}
                >
                  {r.name.split(" ").pop()?.[0]}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-[#d4ccc0]">{r.name}</div>
                  <div className="text-[10px] text-[#6a6050]">
                    {r.field} - Score: {r.score}
                  </div>
                </div>
                <span className="text-[10px] text-[#8fbc8f]">Assigned</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-2">
        Find Reviewers
      </div>
      <input
        type="text"
        placeholder="Search by name or field..."
        value={searchReviewer}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full px-3 py-2 rounded text-[#d4ccc0] font-serif text-xs outline-none box-border mb-2.5"
        style={{
          background: "rgba(30,28,24,0.6)",
          border: "1px solid rgba(120,110,95,0.2)",
        }}
      />

      {/* Unassigned pool */}
      {filteredReviewers
        .filter((r) => !submission.reviewers.includes(r.id))
        .map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2 mb-1 rounded"
            style={{
              background: "rgba(30,28,24,0.4)",
              border: "1px solid rgba(120,110,95,0.08)",
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-[#6a6050]"
              style={{ background: "rgba(120,110,95,0.15)" }}
            >
              {r.name.split(" ").pop()?.[0]}
            </div>
            <div className="flex-1">
              <div className="text-xs text-[#b0a898]">{r.name}</div>
              <div className="text-[10px] text-[#6a6050]">
                {r.field} - {r.reviews} reviews - Score: {r.score}
              </div>
            </div>
            <button
              className="bg-transparent px-2.5 py-[3px] rounded-[3px] text-[10px] text-[#8a8070] cursor-pointer font-serif"
              style={{ border: "1px solid rgba(120,110,95,0.25)" }}
            >
              Assign
            </button>
          </div>
        ))}
    </div>
  );
}
