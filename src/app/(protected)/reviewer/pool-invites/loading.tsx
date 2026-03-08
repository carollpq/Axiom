export default function PoolInvitesLoading() {
  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      <div
        className="h-8 w-48 rounded-[4px] mb-8 animate-pulse"
        style={{ background: 'rgba(120,110,95,0.2)' }}
      />

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[8px] p-6 flex items-center justify-between"
            style={{
              background: 'rgba(45,42,38,0.5)',
              border: '1px solid rgba(120,110,95,0.15)',
            }}
          >
            <div className="flex-1">
              <div
                className="h-4 w-32 rounded-[2px] mb-3 animate-pulse"
                style={{ background: 'rgba(120,110,95,0.2)' }}
              />
              <div
                className="h-3 w-48 rounded-[2px] mb-2 animate-pulse"
                style={{ background: 'rgba(120,110,95,0.15)' }}
              />
              <div
                className="h-3 w-24 rounded-[2px] animate-pulse"
                style={{ background: 'rgba(120,110,95,0.15)' }}
              />
            </div>

            <div className="flex gap-3 ml-6">
              <div
                className="h-8 w-20 rounded-[6px] animate-pulse"
                style={{ background: 'rgba(120,110,95,0.2)' }}
              />
              <div
                className="h-8 w-20 rounded-[6px] animate-pulse"
                style={{ background: 'rgba(120,110,95,0.2)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
