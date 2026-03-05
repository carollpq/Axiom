"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUpload } from "@/src/features/researcher/hooks/useUpload";
import { FileDropzone } from "@/src/shared/components/FileDropzone";
import { HashDisplay } from "@/src/shared/components/HashDisplay";
import { STUDY_TYPE_OPTIONS, PAPER_LIMITS } from "@/src/features/researcher/config/upload";
import { validateUpload } from "@/src/features/researcher/reducers/upload";
import type { StudyTypeDb } from "@/src/shared/lib/db/schema";

interface PaperOption {
  id: string;
  title: string;
  versions: { id: string; versionNumber: number }[];
}

interface JournalOption {
  id: string;
  name: string;
}

interface ContractOption {
  id: string;
  paperTitle: string;
  contributors: string;
}

interface Props {
  papers: PaperOption[];
  journals: JournalOption[];
  contracts: ContractOption[];
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

export function CreateSubmissionClient({ papers: initialPapers, journals, contracts }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"existing" | "upload">("existing");
  const [papers, setPapers] = useState(initialPapers);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [selectedJournalId, setSelectedJournalId] = useState("");
  const [selectedContractId, setSelectedContractId] = useState("");
  const [abstract, setAbstract] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadErrors, setShowUploadErrors] = useState(false);

  const handlePaperRegistered = (paperId: string, title: string) => {
    const newPaper: PaperOption = { id: paperId, title, versions: [{ id: "v1", versionNumber: 1 }] };
    setPapers((prev) => [...prev, newPaper]);
    setSelectedPaperId(paperId);
    setSelectedVersionId("v1");
    setMode("existing");
  };

  const upload = useUpload(handlePaperRegistered);

  const selectedPaper = useMemo(
    () => papers.find((p) => p.id === selectedPaperId),
    [papers, selectedPaperId],
  );

  const versions = selectedPaper?.versions ?? [];

  const handlePaperChange = (paperId: string) => {
    setSelectedPaperId(paperId);
    setSelectedVersionId("");
  };

  const canSubmit =
    selectedPaperId &&
    selectedVersionId &&
    selectedJournalId &&
    selectedContractId &&
    abstract.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      await fetch(`/api/papers/${selectedPaperId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abstract }),
      });

      const res = await fetch(`/api/papers/${selectedPaperId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journalId: selectedJournalId,
          versionId: selectedVersionId,
          contractId: selectedContractId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }

      router.push("/researcher");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const uploadErrors = showUploadErrors ? validateUpload({
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
  }) : {};

  const handleRegister = () => {
    const errors = validateUpload({
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
    });
    if (Object.keys(errors).length > 0) {
      setShowUploadErrors(true);
      return;
    }
    setShowUploadErrors(false);
    upload.register();
  };

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-10">
      <h1 className="text-[28px] font-serif font-normal text-[#e8e0d4] mb-1">
        Create a Submission
      </h1>
      <p className="text-[13px] text-[#6a6050] italic mb-6">
        Submit your paper to a journal for review
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

      {/* Mode Toggle */}
      <div className="flex gap-0 mb-6">
        <button
          onClick={() => setMode("existing")}
          className="px-5 py-2.5 text-[13px] font-serif cursor-pointer transition-colors"
          style={{
            background: mode === "existing" ? "rgba(201,164,74,0.12)" : "rgba(45,42,38,0.4)",
            color: mode === "existing" ? "#c9a44a" : "#6a6050",
            border: `1px solid ${mode === "existing" ? "rgba(201,164,74,0.3)" : "rgba(120,110,95,0.15)"}`,
            borderRadius: "6px 0 0 6px",
          }}
        >
          Select Existing Paper
        </button>
        <button
          onClick={() => setMode("upload")}
          className="px-5 py-2.5 text-[13px] font-serif cursor-pointer transition-colors"
          style={{
            background: mode === "upload" ? "rgba(201,164,74,0.12)" : "rgba(45,42,38,0.4)",
            color: mode === "upload" ? "#c9a44a" : "#6a6050",
            border: `1px solid ${mode === "upload" ? "rgba(201,164,74,0.3)" : "rgba(120,110,95,0.15)"}`,
            borderRadius: "0 6px 6px 0",
            borderLeft: "none",
          }}
        >
          Upload New Paper
        </button>
      </div>

      {/* Upload New Paper Section */}
      {mode === "upload" && (
        <div
          className="rounded-md p-6 mb-6"
          style={{
            background: "rgba(45,42,38,0.4)",
            border: "1px solid rgba(120,110,95,0.15)",
          }}
        >
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-5">
            Register New Paper
          </div>

          {upload.registered ? (
            <div
              className="rounded-md p-4 text-center"
              style={{ background: "rgba(143,188,143,0.08)", border: "1px solid rgba(143,188,143,0.2)" }}
            >
              <div className="text-[14px] text-[#8fbc8f] mb-2">Paper registered successfully</div>
              <div className="text-[12px] text-[#b0a898] mb-3">
                &ldquo;{upload.title}&rdquo; has been auto-selected below. Continue to submit.
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
                  style={{
                    ...inputStyle,
                    ...(uploadErrors.title ? { border: "1px solid rgba(212,100,90,0.4)" } : {}),
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
                  rows={5}
                  style={{
                    ...inputStyle,
                    resize: "vertical" as const,
                    lineHeight: 1.6,
                    ...(uploadErrors.abstract ? { border: "1px solid rgba(212,100,90,0.4)" } : {}),
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
                  className="w-full rounded-[6px] px-3 py-2 text-[12px] font-serif text-[#d4ccc0] outline-none cursor-pointer"
                  style={{
                    background: "rgba(30,28,24,0.6)",
                    border: "1px solid rgba(120,110,95,0.2)",
                    padding: "10px 14px",
                    fontSize: 13,
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
                        onClick={() => upload.removeKeyword(i)}
                        className="cursor-pointer text-[#6a6050] text-[13px]"
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
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      onClick={upload.addKeyword}
                      className="rounded py-0 px-4 text-[#8a8070] text-xs cursor-pointer font-serif"
                      style={{
                        background: "rgba(120,110,95,0.1)",
                        border: "1px solid rgba(120,110,95,0.2)",
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
                  disabled={upload.isRegistering || upload.isHashing}
                  className="px-6 py-2.5 rounded-md text-[13px] font-medium cursor-pointer transition-colors"
                  style={{
                    background: "rgba(201,164,74,0.15)",
                    color: "#c9a44a",
                    border: "1px solid rgba(201,164,74,0.3)",
                    opacity: upload.isRegistering || upload.isHashing ? 0.5 : 1,
                  }}
                >
                  {upload.isRegistering ? "Registering..." : "Register Paper"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Submission Form */}
      <div
        className="rounded-md p-6"
        style={{
          background: "rgba(45,42,38,0.4)",
          border: "1px solid rgba(120,110,95,0.15)",
        }}
      >
        {/* Paper Title */}
        <div className="flex items-center gap-6 mb-5">
          <label className="text-[13px] text-[#b0a898] w-[200px] shrink-0">
            Paper Title
          </label>
          <select
            value={selectedPaperId}
            onChange={(e) => handlePaperChange(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-md text-[13px] font-serif text-[#d4ccc0] cursor-pointer"
            style={{
              background: "rgba(35,32,28,0.8)",
              border: "1px solid rgba(120,110,95,0.2)",
            }}
          >
            <option value="">Select a paper from your repository</option>
            {papers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Paper Version */}
        <div className="flex items-center gap-6 mb-5">
          <label className="text-[13px] text-[#b0a898] w-[200px] shrink-0">
            Paper Version
          </label>
          <select
            value={selectedVersionId}
            onChange={(e) => setSelectedVersionId(e.target.value)}
            disabled={!selectedPaperId}
            className="flex-1 px-3 py-2.5 rounded-md text-[13px] font-serif text-[#d4ccc0] cursor-pointer"
            style={{
              background: "rgba(35,32,28,0.8)",
              border: "1px solid rgba(120,110,95,0.2)",
              opacity: selectedPaperId ? 1 : 0.5,
            }}
          >
            <option value="">Select a version</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                Version {v.versionNumber}
              </option>
            ))}
          </select>
        </div>

        {/* Journal Name */}
        <div className="flex items-center gap-6 mb-5">
          <label className="text-[13px] text-[#b0a898] w-[200px] shrink-0">
            Journal Name
          </label>
          <select
            value={selectedJournalId}
            onChange={(e) => setSelectedJournalId(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-md text-[13px] font-serif text-[#d4ccc0] cursor-pointer"
            style={{
              background: "rgba(35,32,28,0.8)",
              border: "1px solid rgba(120,110,95,0.2)",
            }}
          >
            <option value="">Select a journal</option>
            {journals.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
        </div>

        {/* Associated Authorship Contract */}
        <div className="flex items-center gap-6 mb-5">
          <label className="text-[13px] text-[#b0a898] w-[200px] shrink-0">
            Associated Authorship Contract
          </label>
          <select
            value={selectedContractId}
            onChange={(e) => setSelectedContractId(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-md text-[13px] font-serif text-[#d4ccc0] cursor-pointer"
            style={{
              background: "rgba(35,32,28,0.8)",
              border: "1px solid rgba(120,110,95,0.2)",
            }}
          >
            <option value="">Select a completed contract</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.paperTitle} ({c.contributors})
              </option>
            ))}
          </select>
        </div>

        {/* Abstract */}
        <div className="flex items-start gap-6 mb-6">
          <label className="text-[13px] text-[#b0a898] w-[200px] shrink-0 pt-2">
            Abstract
          </label>
          <textarea
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            placeholder="Enter the abstract of your paper..."
            rows={6}
            className="flex-1 px-3 py-2.5 rounded-md text-[13px] font-serif text-[#d4ccc0] resize-none"
            style={{
              background: "rgba(35,32,28,0.8)",
              border: "1px solid rgba(120,110,95,0.2)",
            }}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="px-6 py-2.5 rounded-md text-[13px] font-medium cursor-pointer transition-colors"
            style={{
              background: canSubmit
                ? "rgba(143,188,143,0.2)"
                : "rgba(120,110,95,0.1)",
              color: canSubmit ? "#8fbc8f" : "#6a6050",
              border: `1px solid ${canSubmit ? "rgba(143,188,143,0.3)" : "rgba(120,110,95,0.15)"}`,
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
