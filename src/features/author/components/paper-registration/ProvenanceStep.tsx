"use client";

import { useRef } from "react";
import type { ProvenanceItem } from "@/src/features/author/types/paper-registration";

interface ProvenanceStepProps {
  fileHash: string;
  datasetHash: string;
  datasetUrl: string;
  codeRepo: string;
  codeCommit: string;
  envHash: string;
  githubConnected: boolean;
  onDatasetHashChange: (v: string) => void;
  onDatasetUrlChange: (v: string) => void;
  onCodeRepoChange: (v: string) => void;
  onCodeCommitChange: (v: string) => void;
  onEnvHashChange: (v: string) => void;
  onDatasetUpload: (file: File) => void;
  onEnvUpload: (file: File) => void;
  onGithubConnect: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", background: "rgba(30,28,24,0.8)",
  border: "1px solid rgba(120,110,95,0.25)", borderRadius: 4,
  color: "#d4ccc0", fontFamily: "'Georgia', serif", fontSize: 13, outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = { fontSize: 10, color: "#8a8070", marginBottom: 6, display: "block" };

const sectionStyle: React.CSSProperties = {
  background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.2)",
  borderRadius: 8, padding: 24, marginBottom: 20,
};

const subsectionStyle: React.CSSProperties = {
  padding: 18, background: "rgba(30,28,24,0.4)", borderRadius: 6,
  border: "1px solid rgba(120,110,95,0.1)",
};

export function ProvenanceStep({
  fileHash, datasetHash, datasetUrl, codeRepo, codeCommit, envHash, githubConnected,
  onDatasetHashChange, onDatasetUrlChange, onCodeRepoChange, onCodeCommitChange, onEnvHashChange,
  onDatasetUpload, onEnvUpload, onGithubConnect,
}: ProvenanceStepProps) {
  const datasetInputRef = useRef<HTMLInputElement>(null);
  const envInputRef = useRef<HTMLInputElement>(null);

  const handleDatasetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onDatasetUpload(file);
    e.target.value = "";
  };

  const handleEnvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onEnvUpload(file);
    e.target.value = "";
  };
  const provenanceItems: ProvenanceItem[] = [
    { label: "Paper", connected: !!fileHash, icon: "\uD83D\uDCC4" },
    { label: "Dataset", connected: !!datasetHash, icon: "\uD83D\uDDC3" },
    { label: "Code", connected: !!codeCommit, icon: "\u2B95" },
    { label: "Environment", connected: !!envHash, icon: "\u2699" },
  ];

  return (
    <div>
      <div style={sectionStyle}>
        <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-5">Provenance Linking</div>

        {/* Dataset */}
        <div className="mb-[22px]" style={subsectionStyle}>
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs text-[#c9b89e]">Dataset</label>
            <span className="text-[10px] text-[#4a4238]">Optional</span>
          </div>
          <div className="mb-2.5">
            <label style={labelStyle}>SHA-256 Hash</label>
            <input
              ref={datasetInputRef}
              type="file"
              onChange={handleDatasetChange}
              className="hidden"
            />
            <div className="flex gap-2">
              <input
                type="text" placeholder="Enter dataset hash or upload to compute..."
                value={datasetHash} onChange={e => onDatasetHashChange(e.target.value)}
                style={{ ...inputStyle, flex: 1, fontFamily: "monospace", fontSize: 12 }}
              />
              <button
                onClick={() => datasetInputRef.current?.click()}
                className="rounded py-0 px-3.5 text-[#8a8070] text-[11px] cursor-pointer font-serif whitespace-nowrap"
                style={{ background: "rgba(120,110,95,0.1)", border: "1px solid rgba(120,110,95,0.2)" }}
              >Upload</button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>External URL (Zenodo, Figshare, etc.)</label>
            <input
              type="text" placeholder="https://zenodo.org/record/..."
              value={datasetUrl} onChange={e => onDatasetUrlChange(e.target.value)}
              style={{ ...inputStyle, fontSize: 12 }}
            />
          </div>
        </div>

        {/* Code Repository */}
        <div className="mb-[22px]" style={subsectionStyle}>
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs text-[#c9b89e]">Code Repository</label>
            <span className="text-[10px] text-[#4a4238]">Optional</span>
          </div>
          {githubConnected ? (
            <div>
              <div
                className="flex items-center gap-2 py-2 px-3 mb-2.5 rounded"
                style={{ background: "rgba(120,180,120,0.06)", border: "1px solid rgba(120,180,120,0.15)" }}
              >
                <span className="text-[#8fbc8f]">{"\u2713"}</span>
                <span className="text-[11px] text-[#8fbc8f]">GitHub connected</span>
              </div>
              <div className="mb-2">
                <label style={labelStyle}>Repository URL</label>
                <input type="text" value={codeRepo} readOnly style={{ ...inputStyle, fontSize: 12, color: "#5a7a9a", fontFamily: "monospace" }} />
              </div>
              <div>
                <label style={labelStyle}>Commit Hash (auto-fetched)</label>
                <input type="text" value={codeCommit} readOnly style={{ ...inputStyle, fontSize: 12, color: "#5a7a9a", fontFamily: "monospace" }} />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex gap-2 mb-2.5">
                <input
                  type="text" placeholder="Repository URL..."
                  value={codeRepo} onChange={e => onCodeRepoChange(e.target.value)}
                  style={{ ...inputStyle, flex: 1, fontSize: 12 }}
                />
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text" placeholder="Git commit hash..."
                  value={codeCommit} onChange={e => onCodeCommitChange(e.target.value)}
                  style={{ ...inputStyle, flex: 1, fontFamily: "monospace", fontSize: 12 }}
                />
              </div>
              <button
                onClick={onGithubConnect}
                className="flex items-center gap-2 py-2 px-4 rounded text-[#b0a898] text-xs cursor-pointer font-serif"
                style={{ background: "rgba(30,28,24,0.8)", border: "1px solid rgba(120,110,95,0.25)" }}
              >
                <span className="text-base">{"\u2B95"}</span> Connect GitHub
              </button>
            </div>
          )}
        </div>

        {/* Environment */}
        <div className="mb-2.5" style={subsectionStyle}>
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs text-[#c9b89e]">Environment Specification</label>
            <span className="text-[10px] text-[#4a4238]">Optional</span>
          </div>
          <input
            ref={envInputRef}
            type="file"
            accept=".json,.yaml,.yml,.toml"
            onChange={handleEnvChange}
            className="hidden"
          />
          <div className="flex gap-2">
            <input
              type="text" placeholder="Hash of Dockerfile or environment.yml..."
              value={envHash} onChange={e => onEnvHashChange(e.target.value)}
              style={{ ...inputStyle, flex: 1, fontFamily: "monospace", fontSize: 12 }}
            />
            <button
              onClick={() => envInputRef.current?.click()}
              className="rounded py-0 px-3.5 text-[#8a8070] text-[11px] cursor-pointer font-serif whitespace-nowrap"
              style={{ background: "rgba(120,110,95,0.1)", border: "1px solid rgba(120,110,95,0.2)" }}
            >Upload</button>
          </div>
          <div className="text-[10px] text-[#4a4238] mt-1.5">Upload a Dockerfile or environment.yml to auto-compute hash</div>
        </div>
      </div>

      {/* Provenance Summary */}
      <div style={sectionStyle}>
        <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3.5">Provenance Summary</div>
        <div
          className="flex items-center justify-center gap-3 p-5 rounded-md"
          style={{ background: "rgba(30,28,24,0.4)", border: "1px solid rgba(120,110,95,0.08)" }}
        >
          {provenanceItems.map((p, i, arr) => (
            <div key={i} className="flex items-center">
              <div className="text-center">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-lg mb-1"
                  style={{
                    background: p.connected ? "rgba(120,180,120,0.1)" : "rgba(120,110,95,0.08)",
                    border: "2px solid " + (p.connected ? "rgba(120,180,120,0.3)" : "rgba(120,110,95,0.15)"),
                  }}
                >{p.icon}</div>
                <div
                  className="text-[9px] uppercase tracking-[0.5px]"
                  style={{ color: p.connected ? "#8fbc8f" : "#4a4238" }}
                >{p.label}</div>
              </div>
              {i < arr.length - 1 && (
                <div className="w-[30px] h-0.5 mx-1 mb-4" style={{ background: "rgba(120,110,95,0.15)" }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
