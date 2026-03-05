interface ReviewerProfileCardProps {
  name: string;
  affiliation: string;
}

export function ReviewerProfileCard({ name, affiliation }: ReviewerProfileCardProps) {
  return (
    <div
      className="rounded-lg p-8 text-center space-y-6"
      style={{ backgroundColor: "rgba(120,110,95,0.15)" }}
    >
      {/* Profile Avatar Circle */}
      <div className="flex justify-center">
        <div
          className="w-24 h-24 rounded-full"
          style={{ backgroundColor: "rgba(100,90,75,0.4)" }}
        />
      </div>

      {/* Name and Affiliation */}
      <div>
        <h3 className="text-lg font-bold mb-1" style={{ color: "#d4ccc0" }}>
          {name}
        </h3>
        <p style={{ color: "#b0a898" }} className="text-sm">
          {affiliation}
        </p>
      </div>

      {/* Link to Copy and Share Button */}
      <button
        className="w-full rounded border px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
        style={{
          backgroundColor: "rgba(100,90,75,0.2)",
          borderColor: "rgba(180,160,130,0.4)",
          color: "#b0a898",
        }}
      >
        Link to copy and share
      </button>

      {/* Social Icons */}
      <div className="flex justify-center gap-3">
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: "rgba(100,90,75,0.4)" }}
        />
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: "rgba(100,90,75,0.4)" }}
        />
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: "rgba(100,90,75,0.4)" }}
        />
      </div>
    </div>
  );
}
