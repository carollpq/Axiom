"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus, X } from "lucide-react";
import { hashFile } from "@/src/shared/lib/hashing";
import { uploadToIPFS } from "@/src/shared/lib/upload";
import { useUpload } from "@/src/features/researcher/hooks/useUpload";
import { validateUpload } from "@/src/features/researcher/reducers/upload";
import { PaperRow } from "./PaperRow";
import type { PaperWithVersions } from "./types";

const RegisterPaperForm = dynamic(
  () => import("./RegisterPaperForm"),
  { loading: () => <div className="p-6 text-[13px] text-[#6a6050]">Loading form...</div> }
);

interface Props {
  papers: PaperWithVersions[];
}

export function PaperVersionControlClient({ papers }: Props) {
  const router = useRouter();
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
    router.refresh();
  }, [router]);

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
        router.refresh();
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
            <RegisterPaperForm
              upload={upload}
              uploadErrors={uploadErrors}
              onRegister={handleRegister}
              onReset={() => { upload.reset(); setShowUploadErrors(false); }}
            />
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
          {localPapers.map((paper) => (
            <PaperRow
              key={paper.id}
              paper={paper}
              isExpanded={expandedPaper === paper.id}
              isUploading={uploading === paper.id}
              onToggle={() => toggle(paper.id)}
              onDownload={handleDownload}
              onUploadClick={handleUploadClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
