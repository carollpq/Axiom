interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-9">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center min-w-[100px]">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-sans font-semibold transition-all duration-300"
              style={{
                background: i < current ? "rgba(120,180,120,0.2)" : i === current ? "rgba(180,160,120,0.25)" : "rgba(120,110,95,0.1)",
                border: "2px solid " + (i < current ? "rgba(120,180,120,0.4)" : i === current ? "rgba(180,160,120,0.5)" : "rgba(120,110,95,0.15)"),
                color: i < current ? "#8fbc8f" : i === current ? "#d4c8a8" : "#4a4238",
              }}
            >
              {i < current ? "\u2713" : i + 1}
            </div>
            <div
              className="text-[10px] mt-1.5 uppercase tracking-[0.8px]"
              style={{ color: i <= current ? "#c9b89e" : "#4a4238" }}
            >{s}</div>
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-[60px] h-0.5 mb-[18px] transition-colors duration-300"
              style={{ background: i < current ? "rgba(120,180,120,0.3)" : "rgba(120,110,95,0.15)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
