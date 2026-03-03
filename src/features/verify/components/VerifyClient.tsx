"use client";

import { useState, useCallback } from "react";
import { hashFile } from "@/src/shared/lib/hashing";

interface VerifyResult {
  found: boolean;
  title?: string;
  registeredAt?: string;
  hederaTxId?: string | null;
  versionNumber?: number;
  author?: string | null;
}

export function VerifyClient() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleVerify = useCallback(async (selectedFile: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const hash = await hashFile(selectedFile);
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash }),
      });

      if (!res.ok) {
        setError("Verification request failed");
        return;
      }

      const data = (await res.json()) as VerifyResult;
      setResult(data);
    } catch {
      setError("An error occurred during verification");
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      handleVerify(droppedFile);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      handleVerify(selectedFile);
    }
  }

  return (
    <div className="max-w-[640px] mx-auto">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className="rounded-lg p-10 text-center cursor-pointer transition-colors"
        style={{
          background: dragActive
            ? "rgba(201,164,74,0.08)"
            : "rgba(45,42,38,0.4)",
          border: `2px dashed ${dragActive ? "rgba(201,164,74,0.5)" : "rgba(120,110,95,0.25)"}`,
        }}
        onClick={() => document.getElementById("verify-file-input")?.click()}
      >
        <input
          id="verify-file-input"
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.tex,.txt"
          onChange={handleFileInput}
        />
        <div className="text-[32px] mb-3 opacity-50">&#128196;</div>
        <p className="text-[15px] text-[#d4ccc0] font-serif mb-1">
          Drop a file here or click to browse
        </p>
        <p className="text-[12px] text-[#6a6050] font-serif">
          The file is hashed locally — it never leaves your browser
        </p>
      </div>

      {/* Status */}
      {file && !isLoading && !result && !error && (
        <div className="mt-4 text-[13px] text-[#8a8070] font-serif">
          Selected: {file.name}
        </div>
      )}

      {isLoading && (
        <div className="mt-6 text-center text-[14px] text-[#c9a44a] font-serif">
          Computing hash and verifying...
        </div>
      )}

      {error && (
        <div
          className="mt-6 rounded-lg p-4 text-[13px] font-serif"
          style={{
            background: "rgba(212,100,90,0.1)",
            border: "1px solid rgba(212,100,90,0.3)",
            color: "#d4645a",
          }}
        >
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className="mt-6 rounded-lg p-5"
          style={{
            background: result.found
              ? "rgba(143,188,143,0.08)"
              : "rgba(212,100,90,0.08)",
            border: `1px solid ${result.found ? "rgba(143,188,143,0.3)" : "rgba(212,100,90,0.3)"}`,
          }}
        >
          {result.found ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#8fbc8f] text-[16px]">&#10003;</span>
                <span className="text-[15px] text-[#8fbc8f] font-serif font-semibold">
                  Verified — paper found on-chain
                </span>
              </div>
              <dl className="space-y-2 text-[13px] font-serif">
                <div className="flex gap-2">
                  <dt className="text-[#6a6050] min-w-[100px]">Title</dt>
                  <dd className="text-[#d4ccc0]">{result.title}</dd>
                </div>
                {result.author && (
                  <div className="flex gap-2">
                    <dt className="text-[#6a6050] min-w-[100px]">Author</dt>
                    <dd className="text-[#d4ccc0]">{result.author}</dd>
                  </div>
                )}
                <div className="flex gap-2">
                  <dt className="text-[#6a6050] min-w-[100px]">Registered</dt>
                  <dd className="text-[#d4ccc0]">
                    {new Date(result.registeredAt!).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-[#6a6050] min-w-[100px]">Version</dt>
                  <dd className="text-[#d4ccc0]">v{result.versionNumber}</dd>
                </div>
                {result.hederaTxId && (
                  <div className="flex gap-2">
                    <dt className="text-[#6a6050] min-w-[100px]">HCS Tx</dt>
                    <dd className="text-[#c9a44a] break-all">{result.hederaTxId}</dd>
                  </div>
                )}
              </dl>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[#d4645a] text-[16px]">&#10007;</span>
              <span className="text-[15px] text-[#d4645a] font-serif">
                No matching paper found — this file has not been registered on Axiom
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
