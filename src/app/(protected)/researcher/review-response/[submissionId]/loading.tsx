export default function ReviewResponseLoading() {
  return (
    <div className="max-w-[1000px] mx-auto px-10 py-8">
      <div className="h-8 w-64 rounded bg-[rgba(45,42,38,0.5)] animate-pulse mb-4" />
      <div className="h-4 w-96 rounded bg-[rgba(45,42,38,0.3)] animate-pulse mb-8" />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-md p-6 mb-4 animate-pulse"
          style={{ background: "rgba(45,42,38,0.3)" }}
        >
          <div className="h-5 w-32 rounded bg-[rgba(120,110,95,0.2)] mb-3" />
          <div className="h-3 w-full rounded bg-[rgba(120,110,95,0.15)] mb-2" />
          <div className="h-3 w-3/4 rounded bg-[rgba(120,110,95,0.15)]" />
        </div>
      ))}
    </div>
  );
}
