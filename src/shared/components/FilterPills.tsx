"use client";

interface FilterPillsProps<T extends string = string> {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}

/** Renders a flat list of pill buttons — no wrapper div.
 *  Caller provides the flex container so pills can be composed
 *  alongside separators or other elements in the same row. */
export function FilterPills<T extends string = string>({
  options,
  value,
  onChange,
}: FilterPillsProps<T>) {
  return (
    <>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="rounded-[3px] py-[5px] px-3 text-[11px] font-serif cursor-pointer transition-all duration-300"
          style={{
            background: value === opt ? "rgba(180,160,120,0.15)" : "transparent",
            border:
              "1px solid " +
              (value === opt ? "rgba(180,160,120,0.3)" : "rgba(120,110,95,0.15)"),
            color: value === opt ? "#c9b89e" : "#6a6050",
          }}
        >
          {opt}
        </button>
      ))}
    </>
  );
}
