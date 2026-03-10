interface StarsProps {
  rating: number;
  max?: number;
}

export function Stars({ rating, max = 5 }: StarsProps) {
  const full = Math.floor(rating);
  const partial = rating - full;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className="text-[14px]"
          style={{
            color:
              i < full
                ? '#c9b458'
                : i === full && partial > 0
                  ? '#c9b458'
                  : '#3a3530',
            opacity: i < full ? 1 : i === full && partial > 0 ? 0.5 : 0.3,
          }}
        >
          {'\u2605'}
        </span>
      ))}
      <span className="text-xs text-[#8a8070] ml-1.5 font-sans">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}
