import { PulseBlock } from '@/src/shared/components/pulse-block';

export default function PoolInvitesLoading() {
  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      <PulseBlock className="h-8 w-48 mb-8" />

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[8px] p-6 flex items-center justify-between"
            style={{
              background: 'rgba(45,42,38,0.5)',
              border: '1px solid rgba(120,110,95,0.15)',
            }}
          >
            <div className="flex-1">
              <PulseBlock className="h-4 w-32 mb-3" />
              <PulseBlock className="h-3 w-48 mb-2" />
              <PulseBlock className="h-3 w-24" />
            </div>

            <div className="flex gap-3 ml-6">
              <PulseBlock className="h-8 w-20" />
              <PulseBlock className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
