"use client";

interface InviteModalProps {
  isOpen: boolean;
  inviteLink: string;
  onClose: () => void;
}

export function InviteModal({ isOpen, inviteLink, onClose }: InviteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[200]"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="rounded-lg p-7 w-[90%] max-w-[440px]"
        style={{ background: "#2a2723", border: "1px solid rgba(120,110,95,0.3)" }}
      >
        <div className="text-base text-[#e8e0d4] italic mb-3">Invite Off-Platform Contributor</div>
        <div className="text-xs text-[#8a8070] mb-4 leading-relaxed">
          Share this link with your collaborator. They will be prompted to connect a wallet and sign the contract.
        </div>
        <div
          className="flex gap-2 py-2.5 px-3.5 rounded"
          style={{ background: "rgba(30,28,24,0.8)", border: "1px solid rgba(120,110,95,0.2)" }}
        >
          <span className="flex-1 text-xs text-[#5a7a9a] font-mono overflow-hidden text-ellipsis">{inviteLink}</span>
          <button
            className="rounded-sm py-1 px-3 text-[#c9b89e] text-[11px] cursor-pointer font-serif"
            style={{ background: "rgba(180,160,120,0.15)", border: "1px solid rgba(180,160,120,0.3)" }}
          >Copy</button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded text-[#6a6050] font-serif text-xs cursor-pointer"
          style={{ background: "none", border: "1px solid rgba(120,110,95,0.2)" }}
        >Close</button>
      </div>
    </div>
  );
}
