interface ModificationWarningProps {
  visible: boolean;
}

export function ModificationWarning({ visible }: ModificationWarningProps) {
  if (!visible) return null;

  return (
    <div
      className="py-3 px-4 mb-6 rounded-md flex items-start gap-2.5"
      style={{ background: "rgba(200,160,100,0.08)", border: "1px solid rgba(200,160,100,0.2)" }}
    >
      <span className="text-[#c4956a] text-base shrink-0 leading-none">{"\u26A0"}</span>
      <div>
        <div className="text-xs text-[#c4956a] font-semibold mb-0.5">Signatures collected</div>
        <div className="text-[11px] text-[#8a8070]">
          Modifying any field will invalidate all existing signatures. All contributors will need to re-sign. Previous versions are retained on-chain.
        </div>
      </div>
    </div>
  );
}
