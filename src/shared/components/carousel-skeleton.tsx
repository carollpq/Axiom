import { PulseBlock } from '@/src/shared/components/pulse-block';

const cardStyle = {
  background: 'rgba(45,42,38,0.5)',
  border: '1px solid rgba(120,110,95,0.15)',
} as const;

export function CarouselSkeleton() {
  return (
    <div>
      <PulseBlock className="h-4 w-36 mb-3" />
      <div className="flex gap-4 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="min-w-[280px] rounded-md p-5"
            style={cardStyle}
          >
            <PulseBlock className="h-4 w-3/4 mb-3" />
            <PulseBlock className="h-3 w-1/2 mb-2" />
            <PulseBlock className="h-3 w-2/3 mb-2" />
            <PulseBlock className="h-3 w-1/3 mb-3" />
            <PulseBlock className="h-6 w-28 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
