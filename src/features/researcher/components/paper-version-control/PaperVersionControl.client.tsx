"use client";

import { useState, useCallback, useRef } from "react";
import { ChevronRight, ChevronDown, Download, Upload } from "lucide-react";
import { hashFile } from "@/src/shared/lib/hashing";
import { uploadToR2 } from "@/src/shared/lib/upload";
import { formatIsoDate } from "@/src/shared/lib/format";

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

export function PaperVersionControlClient({ papers }: Props) {
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPapers, setLocalPapers] = useState(papers);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadPaperIdRef = useRef<string | null>(null);

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
        const fileStorageKey = await uploadToR2(file, hash, "papers");

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

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-10">
      <h1 className="text-[28px] font-serif font-normal text-[#e8e0d4] mb-1">
        Manuscript Repository
      </h1>
      <p className="text-[13px] text-[#6a6050] italic mb-6">
        Manage your papers and their version history
      </p>

      {error && (
        <div
          className="rounded-md px-4 py-3 mb-4 text-[13px]"
          style={{
            background: "rgba(212,100,90,0.15)",
            color: "#d4645a",
            border: "1px solid rgba(212,100,90,0.3)",
          }}
        >
          {error}
        </div>
      )}

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
          No papers yet. Create a paper to get started.
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
