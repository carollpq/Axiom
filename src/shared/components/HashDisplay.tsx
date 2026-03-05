"use client";

import { useState, useRef, useEffect } from "react";

interface HashDisplayProps {
  label: string;
  hash: string;
}

export function HashDisplay({ label, hash }: HashDisplayProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="flex justify-between items-center py-2 px-3 rounded mb-1.5"
      style={{ background: "rgba(30,28,24,0.4)" }}
    >
      <span className="text-[11px] text-[#8a8070]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono" style={{ color: hash ? "#5a7a9a" : "#3a3530" }}>
          {hash ? hash.slice(0, 12) + "..." + hash.slice(-6) : "Not provided"}
        </span>
        {hash && (
          <span className="text-[10px] text-[#6a6050] cursor-pointer" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </span>
        )}
      </div>
    </div>
  );
}
