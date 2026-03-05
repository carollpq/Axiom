"use client";

import { useRef } from "react";

interface FileDropzoneProps {
  accept: string;
  label: string;
  onFileSelect: (file: File) => void;
  fileName: string;
  hash: string;
  isHashing: boolean;
  onRemove: () => void;
  error?: string;
  disabled?: boolean;
}

export function FileDropzone({
  accept,
  label,
  onFileSelect,
  fileName,
  hash,
  isHashing,
  onRemove,
  error,
  disabled,
}: FileDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInteractive = !disabled;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = "";
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <div
        className="rounded-md text-center cursor-pointer transition-all duration-300"
        style={{
          border: error ? "1px solid rgba(212,100,90,0.4)" : "2px dashed rgba(120,110,95,0.25)",
          padding: fileName ? "14px 18px" : "32px 18px",
          background: fileName ? "rgba(120,180,120,0.04)" : "transparent",
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? "none" : undefined,
        }}
        onClick={!fileName && isInteractive ? () => fileInputRef.current?.click() : undefined}
      >
        {fileName ? (
          <div className="flex justify-between items-center">
            <div className="text-left">
              <div className="text-[13px] text-[#d4ccc0] flex items-center gap-1.5">
                <span>{"\uD83D\uDCC4"}</span> {fileName}
              </div>
              {isHashing ? (
                <div className="text-[10px] text-[#c9a44a] font-mono mt-1">Generating digital fingerprint...</div>
              ) : (
                <div className="text-[10px] text-[#5a7a9a] font-mono mt-1">
                  Fingerprint: {hash.slice(0, 16)}...{hash.slice(-8)}
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="rounded-sm text-[#6a6050] py-1 px-2.5 text-[10px] cursor-pointer font-serif"
              style={{ background: "none", border: "1px solid rgba(120,110,95,0.2)" }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <div className="text-2xl text-[#4a4238] mb-2">{"\u2B06"}</div>
            <div className="text-[13px] text-[#6a6050]">{label}</div>
            <div className="text-[10px] text-[#4a4238] mt-1">A unique digital fingerprint is generated locally — your file never leaves your device</div>
          </div>
        )}
      </div>
      {error && <div className="text-[10px] text-[#d4645a] mt-1">{error}</div>}
    </div>
  );
}
