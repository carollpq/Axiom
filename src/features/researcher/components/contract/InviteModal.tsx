"use client";

import { ModalOverlay } from "@/src/shared/components/ModalOverlay";
import { Button } from "@/src/shared/components/Button";

interface InviteModalProps {
  isOpen: boolean;
  inviteLink: string;
  onClose: () => void;
}

export function InviteModal({ isOpen, inviteLink, onClose }: InviteModalProps) {
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
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
      <Button variant="ghost" fullWidth onClick={onClose} className="mt-4 text-xs">
        Close
      </Button>
    </ModalOverlay>
  );
}
