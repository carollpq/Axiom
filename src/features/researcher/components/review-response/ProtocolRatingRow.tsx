"use client";

interface ProtocolRatingRowProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function ProtocolRatingRow({ label, value, onChange }: ProtocolRatingRowProps) {
  return (
    <div>
      <label className="text-[10px] text-[#8a8070] block mb-1">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className="w-7 h-7 rounded text-[11px] font-medium transition-colors"
            style={{
              background:
                value === v
                  ? "rgba(201,164,74,0.3)"
                  : "rgba(120,110,95,0.1)",
              color:
                value === v ? "#c9a44a" : "#6a6050",
              border: `1px solid ${
                value === v
                  ? "rgba(201,164,74,0.4)"
                  : "rgba(120,110,95,0.15)"
              }`,
            }}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
