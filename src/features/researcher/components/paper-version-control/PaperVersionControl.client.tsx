"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { ChevronRight, ChevronDown, Download, Upload, Plus, X } from "lucide-react";
import { hashFile } from "@/src/shared/lib/hashing";
import { uploadToIPFS } from "@/src/shared/lib/upload";
import { formatIsoDate } from "@/src/shared/lib/format";
import { useUpload } from "@/src/features/researcher/hooks/useUpload";
import { FileDropzone } from "@/src/shared/components/FileDropzone";
import { HashDisplay } from "@/src/shared/components/HashDisplay";
import { STUDY_TYPE_OPTIONS, PAPER_LIMITS } from "@/src/features/researcher/config/upload";
import { validateUpload } from "@/src/features/researcher/reducers/upload";
import type { StudyTypeDb } from "@/src/shared/lib/db/schema";

interface PaperVersion {
  id: string;
  versionNumber: number;
  paperHash: string;
  fileStorageKey: string | null;
  createdAt: string;
}

interface PaperWithVersions {
  id: string;
  title: string;
  versions: PaperVersion[];
}

interface Props {
  papers: PaperWithVersions[];
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(30,28,24,0.8)",
  border: "1px solid rgba(120,110,95,0.25)",
  borderRadius: 4,
  color: "#d4ccc0",
  fontFamily: "'Georgia', serif",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#8a8070",
  marginBottom: 6,
  display: "block",
};

export function PaperVersionControlClient({ papers }: Props) {
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPapers, setLocalPapers] = useState(papers);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showUploadErrors, setShowUploadErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadPaperIdRef = useRef<string | null>(null);

  const handlePaperRegistered = useCallback((paperId: string, title: string) => {
    const newPaper: PaperWithVersions = {
      id: paperId,
      title,
      versions: [{ id: "v1", versionNumber: 1, paperHash: "", fileStorageKey: null, createdAt: new Date().toISOString() }],
    };
    setLocalPapers((prev) => [newPaper, ...prev]);
    setShowRegisterForm(false);
    setShowUploadErrors(false);
  }, []);

  const upload = useUpload(handlePaperRegistered);

  const toggle = (id: string) => {
    setExpandedPaper((prev) => (prev === id ? null : id));
  };

  const handleUploadClick = (paperId: string) => {
    uploadPaperIdRef.current = paperId;
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const paperId = uploadPaperIdRef.current;
      if (!file || !paperId) return;

      setUploading(paperId);
      setError(null);

      try {
        const hash = await hashFile(file);
        const fileStorageKey = await uploadToIPFS(file, hash, "papers");

        const res = await fetch(`/api/papers/${paperId}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperHash: hash, fileStorageKey }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to upload version");
        }

        const newVersion = await res.json();

        setLocalPapers((prev) =>
          prev.map((p) =>
            p.id === paperId
              ? { ...p, versions: [...p.versions, newVersion] }
              : p,
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Upload failed",
        );
      } finally {
        setUploading(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [],
  );

  const handleDownload = async (paperId: string, versionId: string) => {
    try {
      const res = await fetch(
        `/api/papers/${paperId}/content?versionId=${versionId}`,
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paper-v${versionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Download failed");
    }
  };

  const validationErrors = useMemo(() => validateUpload({
    title: upload.title,
    abstract: upload.abstract,
    fileName: upload.fileName,
    fileHash: upload.fileHash,
    isHashing: upload.isHashing,
    studyType: upload.studyType,
    keywords: upload.keywords,
    keywordInput: upload.keywordInput,
    registering: upload.isRegistering,
    registered: upload.registered,
    paperId: upload.registeredPaperId,
    error: upload.error,
  }), [upload.title, upload.abstract, upload.fileName, upload.fileHash,
    upload.isHashing, upload.studyType, upload.keywords, upload.keywordInput,
    upload.isRegistering, upload.registered, upload.registeredPaperId, upload.error]);

  const isFormBusy = upload.isRegistering || upload.isHashing;
  const uploadErrors = showUploadErrors ? validationErrors : {};

  const handleRegister = () => {
    if (Object.keys(validationErrors).length > 0) {
      setShowUploadErrors(true);
      return;
    }
    setShowUploadErrors(false);
    upload.register();
  };

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-10">
      <h1 className="text-[28px] font-serif font-normal text-[#e8e0d4] mb-1">
        Manuscript Repository
      </h1>
      <p className="text-[13px] text-[#6a6050] italic mb-6">
        Manage your papers and their version history
      </p>

      {(error || upload.error) && (
        <div
          className="rounded-md px-4 py-3 mb-4 text-[13px]"
          style={{
            background: "rgba(212,100,90,0.15)",
            color: "#d4645a",
            border: "1px solid rgba(212,100,90,0.3)",
          }}
        >
          {error || upload.error}
        </div>
      )}

      {/* Register New Paper Section */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => {
            setShowRegisterForm((prev) => !prev);
            if (showRegisterForm) {
              upload.reset();
              setShowUploadErrors(false);
            }
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-md text-[13px] font-serif cursor-pointer transition-colors w-full"
          style={{
            background: showRegisterForm ? "rgba(201,164,74,0.12)" : "rgba(45,42,38,0.4)",
            color: showRegisterForm ? "#c9a44a" : "#b0a898",
            border: `1px solid ${showRegisterForm ? "rgba(201,164,74,0.3)" : "rgba(120,110,95,0.15)"}`,
          }}
        >
          {showRegisterForm ? <X size={16} /> : <Plus size={16} />}
          {showRegisterForm ? "Cancel Registration" : "Register New Paper"}
        </button>

        {showRegisterForm && (
          <div
            className="rounded-b-md p-6"
            style={{
              background: "rgba(45,42,38,0.4)",
              border: "1px solid rgba(120,110,95,0.15)",
              borderTop: "none",
            }}
          >
            {upload.registered ? (
              <div
                className="rounded-md p-4 text-center"
                style={{ background: "rgba(143,188,143,0.08)", border: "1px solid rgba(143,188,143,0.2)" }}
              >
                <div className="text-[14px] text-[#8fbc8f] mb-2">Paper registered successfully</div>
                <div className="text-[12px] text-[#b0a898] mb-3">
                  &ldquo;{upload.title}&rdquo; has been added to your repository.
                </div>
                {upload.fileHash && <HashDisplay label="Paper Hash (SHA-256)" hash={upload.fileHash} />}
              </div>
            ) : (
              <>
                {/* PDF Upload */}
                <div className="mb-[18px]">
                  <label style={labelStyle}>
                    Paper File (PDF) <span className="text-[#d4645a]">*</span>
                  </label>
                  <FileDropzone
                    accept=".pdf"
                    label="Click to upload PDF"
                    onFileSelect={upload.handleFileSelect}
                    fileName={upload.fileName}
                    hash={upload.fileHash}
                    isHashing={upload.isHashing}
                    onRemove={upload.removeFile}
                    error={uploadErrors.file}
                    disabled={isFormBusy}
                  />
                </div>

                {/* Title */}
                <div className="mb-[18px]">
                  <label style={labelStyle}>
                    Title <span className="text-[#d4645a]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter paper title..."
                    value={upload.title}
                    onChange={(e) => upload.setTitle(e.target.value)}
                    disabled={isFormBusy}
                    style={{
                      ...inputStyle,
                      ...(uploadErrors.title ? { border: "1px solid rgba(212,100,90,0.4)" } : {}),
                      ...(isFormBusy ? { opacity: 0.5 } : {}),
                    }}
                  />
                  {uploadErrors.title && (
                    <div className="text-[10px] text-[#d4645a] mt-1">{uploadErrors.title}</div>
                  )}
                </div>

                {/* Abstract */}
                <div className="mb-[18px]">
                  <label style={labelStyle}>
                    Abstract <span className="text-[#d4645a]">*</span>
                  </label>
                  <textarea
                    placeholder="Enter abstract..."
                    value={upload.abstract}
                    onChange={(e) => upload.setAbstract(e.target.value)}
                    disabled={isFormBusy}
                    rows={5}
                    style={{
                      ...inputStyle,
                      resize: "vertical" as const,
                      lineHeight: 1.6,
                      ...(uploadErrors.abstract ? { border: "1px solid rgba(212,100,90,0.4)" } : {}),
                      ...(isFormBusy ? { opacity: 0.5 } : {}),
                    }}
                  />
                  {uploadErrors.abstract && (
                    <div className="text-[10px] text-[#d4645a] mt-1">{uploadErrors.abstract}</div>
                  )}
                </div>

                {/* Study Type */}
                <div className="mb-[18px]">
                  <label style={labelStyle}>Study Type</label>
                  <select
                    value={upload.studyType}
                    onChange={(e) => upload.setStudyType(e.target.value as StudyTypeDb)}
                    disabled={isFormBusy}
                    className="w-full rounded-[6px] px-3 py-2 text-[12px] font-serif text-[#d4ccc0] outline-none cursor-pointer"
                    style={{
                      background: "rgba(30,28,24,0.6)",
                      border: "1px solid rgba(120,110,95,0.2)",
                      padding: "10px 14px",
                      fontSize: 13,
                      ...(isFormBusy ? { opacity: 0.5 } : {}),
                    }}
                  >
                    {STUDY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Keywords */}
                <div className="mb-[18px]">
                  <label style={labelStyle}>
                    Keywords
                    <span className="ml-2 text-[10px] text-[#6a6050]">
                      {upload.keywords.length}/{PAPER_LIMITS.keywords.max}
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {upload.keywords.map((k, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px] text-[#b0a898]"
                        style={{
                          background: "rgba(120,110,95,0.12)",
                          border: "1px solid rgba(120,110,95,0.2)",
                        }}
                      >
                        {k}
                        <span
                          onClick={isFormBusy ? undefined : () => upload.removeKeyword(i)}
                          className={`text-[#6a6050] text-[13px] ${isFormBusy ? "" : "cursor-pointer"}`}
                          style={isFormBusy ? { opacity: 0.5 } : undefined}
                        >
                          {"\u2715"}
                        </span>
                      </span>
                    ))}
                  </div>
                  {upload.keywords.length < PAPER_LIMITS.keywords.max && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add keyword..."
                        value={upload.keywordInput}
                        onChange={(e) => upload.setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && upload.keywordInput.trim()) upload.addKeyword();
                        }}
                        disabled={isFormBusy}
                        style={{ ...inputStyle, flex: 1, ...(isFormBusy ? { opacity: 0.5 } : {}) }}
                      />
                      <button
                        onClick={upload.addKeyword}
                        disabled={isFormBusy}
                        className="rounded py-0 px-4 text-[#8a8070] text-xs cursor-pointer font-serif"
                        style={{
                          background: "rgba(120,110,95,0.1)",
                          border: "1px solid rgba(120,110,95,0.2)",
                          ...(isFormBusy ? { opacity: 0.5 } : {}),
                        }}
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                {/* Register Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={isFormBusy}
                    className="px-6 py-2.5 rounded-md text-[13px] font-medium cursor-pointer transition-colors"
                    style={{
                      background: "rgba(201,164,74,0.15)",
                      color: "#c9a44a",
                      border: "1px solid rgba(201,164,74,0.3)",
                      opacity: isFormBusy ? 0.5 : 1,
                    }}
                  >
                    {upload.isRegistering ? "Registering..." : "Register Paper"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {localPapers.length === 0 ? (
        <div
          className="rounded-md px-6 py-10 text-center text-[13px] text-[#6a6050]"
          style={{
            background: "rgba(45,42,38,0.4)",
            border: "1px solid rgba(120,110,95,0.15)",
          }}
        >
          No papers yet. Register a paper above to get started.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {localPapers.map((paper) => {
            const isExpanded = expandedPaper === paper.id;
            const isUploading = uploading === paper.id;

            return (
              <div key={paper.id}>
                <button
                  type="button"
                  onClick={() => toggle(paper.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-md text-left cursor-pointer transition-colors"
                  style={{
                    background: isExpanded
                      ? "rgba(45,42,38,0.7)"
                      : "rgba(45,42,38,0.4)",
                    border: "1px solid rgba(120,110,95,0.2)",
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-[#8a8070] shrink-0" />
                  ) : (
                    <ChevronRight size={16} className="text-[#8a8070] shrink-0" />
                  )}
                  <span className="text-[14px] font-serif text-[#e8e0d4]">
                    {paper.title}
                  </span>
                  <span className="ml-auto text-[11px] text-[#6a6050]">
                    {paper.versions.length} version{paper.versions.length !== 1 ? "s" : ""}
                  </span>
                </button>

                {isExpanded && (
                  <div
                    className="ml-8 mt-1 mb-2 flex flex-col gap-1"
                    style={{ borderLeft: "2px solid rgba(120,110,95,0.15)" }}
                  >
                    {paper.versions.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-4 px-5 py-3"
                        style={{
                          background: "rgba(45,42,38,0.3)",
                        }}
                      >
                        <span className="text-[13px] text-[#b0a898]">
                          Version {v.versionNumber}
                        </span>
                        <span className="text-[11px] text-[#6a6050] ml-auto">
                          {formatIsoDate(v.createdAt)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDownload(paper.id, v.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium cursor-pointer"
                          style={{
                            background: "rgba(90,122,154,0.15)",
                            color: "#5a7a9a",
                            border: "1px solid rgba(90,122,154,0.25)",
                          }}
                        >
                          <Download size={12} />
                          Download PDF
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleUploadClick(paper.id)}
                      disabled={isUploading}
                      className="flex items-center gap-2 px-5 py-3 cursor-pointer"
                      style={{
                        background: "rgba(201,164,74,0.08)",
                        opacity: isUploading ? 0.5 : 1,
                      }}
                    >
                      <Upload size={14} className="text-[#c9a44a]" />
                      <span className="text-[12px] text-[#c9a44a]">
                        {isUploading ? "Uploading..." : "Upload a New Version"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
