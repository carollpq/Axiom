export function MethodologyBanner() {
  return (
    <div
      className="rounded-md px-5 py-4 mb-6 text-sm font-serif"
      style={{
        background: "rgba(90,122,154,0.12)",
        border: "1px solid rgba(90,122,154,0.3)",
        color: "#8ab4d4",
      }}
    >
      <span className="font-semibold mr-2" style={{ color: "#a0c8e8" }}>
        Reviewer Guidance:
      </span>
      Evaluate methodology and rigor, not outcomes or results. Focus on whether
      the research process is sound, reproducible, and clearly documented.
    </div>
  );
}
