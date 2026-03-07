"use client";

interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function ModalOverlay({
  isOpen,
  onClose,
  children,
  maxWidth = "440px",
}: ModalOverlayProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[200]"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-lg p-6 w-[90%]"
        style={{
          maxWidth,
          background: "#2a2723",
          border: "1px solid rgba(120,110,95,0.3)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
