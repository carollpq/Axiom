interface PerformanceMetricsProps {
  reliabilityScore: number;
  completedReviews: number;
  invites: number;
  averageDaysToDeadline: number;
}

export function PerformanceMetrics({
  reliabilityScore,
  completedReviews,
  invites,
  averageDaysToDeadline,
}: PerformanceMetricsProps) {
  const formatScore = (score: number) => {
    return Math.round(score * 10) / 10;
  };

  return (
    <div
      className="rounded-lg p-8 space-y-6"
      style={{ backgroundColor: "rgba(120,110,95,0.15)" }}
    >
      <h3 className="text-lg font-bold" style={{ color: "#d4ccc0" }}>
        Performance Metrics
      </h3>

      <div className="grid grid-cols-4 gap-4">
        {/* Reliability Score */}
        <div
          className="rounded border p-6 text-center"
          style={{
            backgroundColor: "rgba(100,90,75,0.2)",
            borderColor: "rgba(180,160,130,0.4)",
          }}
        >
          <div className="text-3xl font-bold mb-2" style={{ color: "#c9a44a" }}>
            {formatScore(reliabilityScore)}
          </div>
          <div className="text-sm" style={{ color: "#b0a898" }}>
            Review Reliability Score
          </div>
        </div>

        {/* Completed Reviews */}
        <div
          className="rounded border p-6 text-center"
          style={{
            backgroundColor: "rgba(100,90,75,0.2)",
            borderColor: "rgba(180,160,130,0.4)",
          }}
        >
          <div className="text-3xl font-bold mb-2" style={{ color: "#c9a44a" }}>
            {completedReviews}
          </div>
          <div className="text-sm" style={{ color: "#b0a898" }}>
            Completed Verified Reviews
          </div>
        </div>

        {/* Invites */}
        <div
          className="rounded border p-6 text-center"
          style={{
            backgroundColor: "rgba(100,90,75,0.2)",
            borderColor: "rgba(180,160,130,0.4)",
          }}
        >
          <div className="text-3xl font-bold mb-2" style={{ color: "#c9a44a" }}>
            {invites}
          </div>
          <div className="text-sm" style={{ color: "#b0a898" }}>
            Invites
          </div>
        </div>

        {/* Average Days to Deadline */}
        <div
          className="rounded border p-6 text-center"
          style={{
            backgroundColor: "rgba(100,90,75,0.2)",
            borderColor: "rgba(180,160,130,0.4)",
          }}
        >
          <div className="text-3xl font-bold mb-2" style={{ color: "#c9a44a" }}>
            {formatScore(averageDaysToDeadline)}
          </div>
          <div className="text-sm" style={{ color: "#b0a898" }}>
            Average days to deadline
          </div>
        </div>
      </div>
    </div>
  );
}
