export function SelectionPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 m-4">
      <div
        className="flex flex-col items-center justify-center w-full py-10 rounded-[8px]"
        style={{ border: "1.5px dashed rgba(120,110,95,0.25)" }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6a6050"
          strokeWidth="1.5"
          className="mb-3 opacity-50"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span className="font-serif text-[13px] text-[#6a6050]">{message}</span>
      </div>
    </div>
  );
}
