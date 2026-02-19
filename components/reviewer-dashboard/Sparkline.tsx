import type { ReputationDataPoint } from "@/types/reviewer-dashboard";

interface SparklineProps {
  data: ReputationDataPoint[];
}

export function Sparkline({ data }: SparklineProps) {
  const min = Math.min(...data.map((d) => d.score)) - 0.2;
  const max = Math.max(...data.map((d) => d.score)) + 0.2;
  const w = 140;
  const h = 40;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d.score - min) / (max - min)) * h;
    return `${x},${y}`;
  });
  const lastY = h - ((data[data.length - 1].score - min) / (max - min)) * h;

  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9b89e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#c9b89e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill="url(#sparkGrad)" />
      <polyline points={pts.join(" ")} fill="none" stroke="#c9b89e" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={w} cy={lastY} r="3" fill="#c9b89e" />
    </svg>
  );
}
