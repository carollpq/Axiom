interface HashRowProps {
  label: string;
  hash: string;
  url?: string;
}

export function HashRow({ label, hash, url }: HashRowProps) {
  return (
    <div
      className="flex justify-between items-center py-2"
      style={{ borderBottom: "1px solid rgba(120,110,95,0.06)" }}
    >
      <span className="text-[11px] text-[#8a8070]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono" style={{ color: hash ? "#5a7a9a" : "#3a3530" }}>
          {hash ? (hash.length > 20 ? hash.slice(0, 12) + "..." + hash.slice(-6) : hash) : "N/A"}
        </span>
        {hash && <span className="text-[10px] text-[#c9b89e] cursor-pointer">Verify {"\u2197"}</span>}
        {url && <span className="text-[10px] text-[#7a9fc7] cursor-pointer">Source {"\u2197"}</span>}
      </div>
    </div>
  );
}
