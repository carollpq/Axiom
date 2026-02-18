interface StepNavigationProps {
  step: number;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function StepNavigation({ step, canProceed, onBack, onNext }: StepNavigationProps) {
  const canGoBack = step > 0;
  const showNext = step < 3;

  return (
    <div className="flex justify-between mt-7">
      <button
        onClick={canGoBack ? onBack : undefined}
        disabled={!canGoBack}
        className="py-2.5 px-6 rounded font-serif text-[13px]"
        style={{
          background: "none",
          border: "1px solid " + (canGoBack ? "rgba(120,110,95,0.25)" : "rgba(120,110,95,0.1)"),
          color: canGoBack ? "#8a8070" : "#3a3530",
          cursor: canGoBack ? "pointer" : "not-allowed",
        }}
      >{"\u2190"} Back</button>

      {showNext && (
        <button
          onClick={canProceed ? onNext : undefined}
          disabled={!canProceed}
          className="py-2.5 px-6 rounded font-serif text-[13px]"
          style={{
            background: canProceed ? "linear-gradient(135deg, rgba(180,160,120,0.2), rgba(160,140,100,0.1))" : "rgba(120,110,95,0.1)",
            border: "1px solid " + (canProceed ? "rgba(180,160,120,0.3)" : "rgba(120,110,95,0.15)"),
            color: canProceed ? "#d4c8a8" : "#4a4238",
            cursor: canProceed ? "pointer" : "not-allowed",
          }}
        >Next {"\u2192"}</button>
      )}
    </div>
  );
}
