"use client";

import { ModalOverlay } from "./ModalOverlay";
import { Button } from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "red" | "gold";
  isLoading?: boolean;
  loadingLabel?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant = "red",
  isLoading = false,
  loadingLabel = "Processing...",
}: ConfirmDialogProps) {
  return (
    <ModalOverlay isOpen={isOpen} onClose={isLoading ? () => {} : onClose}>
      <h3 className="text-[15px] font-serif text-[#d4ccc0] mb-3">{title}</h3>
      <p className="text-[13px] text-[#8a8070] mb-5 leading-relaxed">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? loadingLabel : confirmLabel}
        </Button>
      </div>
    </ModalOverlay>
  );
}
