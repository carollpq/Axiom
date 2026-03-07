import { DashboardCard } from '@/src/shared/components/DashboardCard';

interface ResearchersInsightsProps {
  journalsReviewed: string[];
  insights: string[];
}

export function ResearchersInsights({
  journalsReviewed,
  insights,
}: ResearchersInsightsProps) {
  return (
    <DashboardCard className="grid grid-cols-2 gap-8">
      {/* Reviewed For Section */}
      <div>
        <h4 className="font-bold mb-4" style={{ color: '#d4ccc0' }}>
          Reviewed for:
        </h4>
        <div className="space-y-2 flex flex-col">
          {journalsReviewed.length > 0 ? (
            journalsReviewed.map((journal, idx) => (
              <button
                key={idx}
                className="rounded border px-3 py-2 text-left text-sm transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'rgba(100,90,75,0.2)',
                  borderColor: 'rgba(180,160,130,0.4)',
                  color: '#b0a898',
                }}
              >
                {journal}
              </button>
            ))
          ) : (
            <div style={{ color: '#8a8070' }} className="text-sm">
              No journals yet
            </div>
          )}
        </div>
      </div>

      {/* Researchers Insights Section */}
      <div>
        <h4 className="font-bold mb-4" style={{ color: '#d4ccc0' }}>
          Researchers insights:
        </h4>
        <div
          className="rounded border p-4 space-y-3 h-32 overflow-y-auto"
          style={{
            backgroundColor: 'rgba(100,90,75,0.2)',
            borderColor: 'rgba(180,160,130,0.4)',
          }}
        >
          {insights.map((insight, idx) => (
            <p
              key={idx}
              className="text-sm leading-relaxed"
              style={{ color: '#b0a898' }}
            >
              {insight}
            </p>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
