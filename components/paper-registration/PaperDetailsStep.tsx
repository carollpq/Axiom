"use client";

import { useRef } from "react";
import type { Visibility } from "@/types/paper-registration";

interface PaperDetailsStepProps {
  title: string;
  abstract: string;
  fileName: string;
  fileHash: string;
  isHashing: boolean;
  visibility: Visibility;
  keywords: string[];
  keywordInput: string;
  onTitleChange: (v: string) => void;
  onAbstractChange: (v: string) => void;
  onVisibilityChange: (v: Visibility) => void;
  onKeywordInputChange: (v: string) => void;
  onAddKeyword: () => void;
  onRemoveKeyword: (i: number) => void;
  onFileUpload: (file: File) => void;
  onFileRemove: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", background: "rgba(30,28,24,0.8)",
  border: "1px solid rgba(120,110,95,0.25)", borderRadius: 4,
  color: "#d4ccc0", fontFamily: "'Georgia', serif", fontSize: 13, outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = { fontSize: 11, color: "#8a8070", marginBottom: 6, display: "block" };

const visibilityOptions = [
  { key: "private" as const, label: "Private Draft", desc: "Only hash recorded. Content not accessible to others." },
  { key: "public" as const, label: "Public Draft", desc: "Content accessible via the platform." },
];

export function PaperDetailsStep({
  title, abstract, fileName, fileHash, isHashing, visibility, keywords, keywordInput,
  onTitleChange, onAbstractChange, onVisibilityChange, onKeywordInputChange,
  onAddKeyword, onRemoveKeyword, onFileUpload, onFileRemove,
}: PaperDetailsStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
    e.target.value = "";
  };

  return (
    <div
      className="rounded-lg p-6 mb-5"
      style={{ background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.2)" }}
    >
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-5">Paper Details</div>

      {/* Title */}
      <div className="mb-[18px]">
        <label style={labelStyle}>Title <span className="text-[#d4645a]">*</span></label>
        <input
          type="text" placeholder="Enter paper title..."
          value={title} onChange={e => onTitleChange(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Abstract */}
      <div className="mb-[18px]">
        <label style={labelStyle}>Abstract <span className="text-[#d4645a]">*</span></label>
        <textarea
          placeholder="Enter abstract..."
          value={abstract} onChange={e => onAbstractChange(e.target.value)}
          rows={5}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
        />
      </div>

      {/* File upload */}
      <div className="mb-[18px]">
        <label style={labelStyle}>Paper File (PDF) <span className="text-[#d4645a]">*</span></label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <div
          className="rounded-md text-center cursor-pointer transition-all duration-300"
          style={{
            border: "2px dashed rgba(120,110,95,0.25)",
            padding: fileName ? "14px 18px" : "32px 18px",
            background: fileName ? "rgba(120,180,120,0.04)" : "transparent",
          }}
          onClick={!fileName ? () => fileInputRef.current?.click() : undefined}
        >
          {fileName ? (
            <div className="flex justify-between items-center">
              <div className="text-left">
                <div className="text-[13px] text-[#d4ccc0] flex items-center gap-1.5">
                  <span>{"\uD83D\uDCC4"}</span> {fileName}
                </div>
                {isHashing ? (
                  <div className="text-[10px] text-[#c9a44a] font-mono mt-1">Computing SHA-256...</div>
                ) : (
                  <div className="text-[10px] text-[#5a7a9a] font-mono mt-1">
                    SHA-256: {fileHash.slice(0, 16)}...{fileHash.slice(-8)}
                  </div>
                )}
              </div>
              <button
                onClick={e => { e.stopPropagation(); onFileRemove(); }}
                className="rounded-sm text-[#6a6050] py-1 px-2.5 text-[10px] cursor-pointer font-serif"
                style={{ background: "none", border: "1px solid rgba(120,110,95,0.2)" }}
              >Remove</button>
            </div>
          ) : (
            <div>
              <div className="text-2xl text-[#4a4238] mb-2">{"\u2B06"}</div>
              <div className="text-[13px] text-[#6a6050]">Click to upload PDF</div>
              <div className="text-[10px] text-[#4a4238] mt-1">SHA-256 hash computed client-side for transparency</div>
            </div>
          )}
        </div>
      </div>

      {/* Visibility */}
      <div className="mb-[18px]">
        <label style={labelStyle}>Visibility</label>
        <div className="flex gap-2.5">
          {visibilityOptions.map(v => (
            <button
              key={v.key}
              onClick={() => onVisibilityChange(v.key)}
              className="flex-1 py-3 px-4 text-left cursor-pointer rounded-md transition-all duration-300"
              style={{
                background: visibility === v.key ? "rgba(180,160,120,0.08)" : "rgba(30,28,24,0.4)",
                border: "1px solid " + (visibility === v.key ? "rgba(180,160,120,0.3)" : "rgba(120,110,95,0.12)"),
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ border: "2px solid " + (visibility === v.key ? "#c9b89e" : "rgba(120,110,95,0.3)") }}
                >
                  {visibility === v.key && <div className="w-2 h-2 rounded-full bg-[#c9b89e]" />}
                </div>
                <span className="text-[13px]" style={{ color: visibility === v.key ? "#d4c8a8" : "#8a8070" }}>{v.label}</span>
              </div>
              <div className="text-[10px] text-[#5a5345] ml-6">{v.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div>
        <label style={labelStyle}>Research Fields / Keywords</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {keywords.map((k, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px] text-[#b0a898]"
              style={{ background: "rgba(120,110,95,0.12)", border: "1px solid rgba(120,110,95,0.2)" }}
            >
              {k}
              <span
                onClick={() => onRemoveKeyword(i)}
                className="cursor-pointer text-[#6a6050] text-[13px]"
              >{"\u2715"}</span>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text" placeholder="Add keyword..."
            value={keywordInput} onChange={e => onKeywordInputChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && keywordInput.trim()) onAddKeyword(); }}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={onAddKeyword}
            className="rounded py-0 px-4 text-[#8a8070] text-xs cursor-pointer font-serif"
            style={{ background: "rgba(120,110,95,0.1)", border: "1px solid rgba(120,110,95,0.2)" }}
          >Add</button>
        </div>
      </div>
    </div>
  );
}
