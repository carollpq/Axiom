import type { Contributor } from "@/src/features/author/types/contract";

interface SignatureProgressProps {
  contributors: Contributor[];
  signedCount: number;
  allSigned: boolean;
}

export function SignatureProgress({ contributors, signedCount, allSigned }: SignatureProgressProps) {
  return (
    <div className="rounded-lg p-6 mb-6" style={{ background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.2)" }}>
      <div className="flex justify-between items-center mb-3.5">
        <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px]">Signature Progress</div>
        <span className="text-[13px]" style={{ color: allSigned ? "#8fbc8f" : "#c9b89e" }}>
          {signedCount} of {contributors.length} signed
        </span>
      </div>

      <div className="w-full h-2 rounded overflow-hidden" style={{ background: "rgba(120,110,95,0.15)" }}>
        <div
          className="h-full rounded transition-[width] duration-500 ease-out"
          style={{
            width: (signedCount / contributors.length * 100) + "%",
            background: allSigned ? "linear-gradient(90deg, #8fbc8f, #a0d0a0)" : "linear-gradient(90deg, #c9b89e, #d4c8a8)",
          }}
        />
      </div>

      <div className="flex gap-3 mt-3">
        {contributors.map(c => (
          <div
            key={c.id}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px]"
            style={{
              background: c.status === "signed" ? "rgba(120,180,120,0.08)" : "rgba(120,110,95,0.06)",
              border: "1px solid " + (c.status === "signed" ? "rgba(120,180,120,0.15)" : "rgba(120,110,95,0.1)"),
            }}
          >
            <span style={{ color: c.status === "signed" ? "#8fbc8f" : c.status === "declined" ? "#d4645a" : "#6a6050" }}>
              {c.status === "signed" ? "\u2713" : c.status === "declined" ? "\u2715" : "\u25CB"}
            </span>
            <span style={{ color: c.status === "signed" ? "#8fbc8f" : "#8a8070" }}>
              {c.name.split(" ").pop()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
