"use client";

import { useState } from "react";

const signedContracts = [
  { id: 1, title: "On the Reproducibility of Transformer Architectures in Low-Resource Settings", hash: "0xfa91...2c3d", contributors: "A. Reeves (40%), M. Chen (35%), L. Vasquez (25%)", date: "2025-10-10" },
  { id: 2, title: "Adversarial Robustness in Federated Learning Protocols", hash: "0x1e4c...a3b7", contributors: "A. Reeves (40%), J. Kim (30%), S. Huang (30%)", date: "2026-02-06" },
];

const registeredJournals = [
  { id: 1, name: "Journal of Computational Research", field: "Computer Science", score: 4.3 },
  { id: 2, name: "Nature Machine Learning", field: "Machine Learning", score: 4.8 },
  { id: 3, name: "IEEE Transactions on Neural Networks", field: "Deep Learning", score: 4.1 },
  { id: 4, name: "ACL Rolling Review", field: "NLP", score: 4.5 },
];

const StepIndicator = ({ steps, current }: { steps: string[]; current: number }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 36 }}>
    {steps.map((s, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontFamily: "sans-serif", fontWeight: 600, transition: "all 0.3s",
            background: i < current ? "rgba(120,180,120,0.2)" : i === current ? "rgba(180,160,120,0.25)" : "rgba(120,110,95,0.1)",
            border: "2px solid " + (i < current ? "rgba(120,180,120,0.4)" : i === current ? "rgba(180,160,120,0.5)" : "rgba(120,110,95,0.15)"),
            color: i < current ? "#8fbc8f" : i === current ? "#d4c8a8" : "#4a4238",
          }}>
            {i < current ? "\u2713" : i + 1}
          </div>
          <div style={{
            fontSize: 10, marginTop: 6, textTransform: "uppercase", letterSpacing: 0.8,
            color: i <= current ? "#c9b89e" : "#4a4238",
          }}>{s}</div>
        </div>
        {i < steps.length - 1 && (
          <div style={{
            width: 60, height: 2, marginBottom: 18,
            background: i < current ? "rgba(120,180,120,0.3)" : "rgba(120,110,95,0.15)",
            transition: "background 0.3s",
          }} />
        )}
      </div>
    ))}
  </div>
);

export default function PaperRegistration() {
  const [step, setStep] = useState(0);

  // Step 1: Paper Details
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [keywords, setKeywords] = useState(["machine learning", "reproducibility"]);
  const [keywordInput, setKeywordInput] = useState("");

  // Step 2: Provenance
  const [datasetHash, setDatasetHash] = useState("");
  const [datasetUrl, setDatasetUrl] = useState("");
  const [codeRepo, setCodeRepo] = useState("");
  const [codeCommit, setCodeCommit] = useState("");
  const [envHash, setEnvHash] = useState("");
  const [githubConnected, setGithubConnected] = useState(false);

  // Step 3: Contract
  const [selectedContract, setSelectedContract] = useState<number | null>(null);

  // Step 4: Confirmation
  const [registered, setRegistered] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<number | null>(null);
  const [txHash, setTxHash] = useState("");
  const [txTimestamp, setTxTimestamp] = useState("");

  const steps = ["Paper Details", "Provenance", "Contract", "Register / Submit"];

  const simulateFileUpload = () => {
    setFileName("paper_draft_v1.pdf");
    setFileHash("a3f7c9e1b2d84056e9f1a7b3c2d5e8f0" + "1a2b3c4d5e6f7890");
  };

  const simulateDatasetUpload = () => {
    setDatasetHash("d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9" + "0b1c2d3e4f5a6b7c");
  };

  const simulateEnvUpload = () => {
    setEnvHash("e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" + "c1d2e3f4a5b6c7d8");
  };

  const simulateGithub = () => {
    setGithubConnected(true);
    setCodeRepo("https://github.com/areeves/transformer-reproducibility");
    setCodeCommit("a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6");
  };

  const handleRegister = () => {
    setTxHash("0x" + Math.random().toString(16).slice(2, 10) + "..." + Math.random().toString(16).slice(2, 6));
    setTxTimestamp("2026-02-08 11:42:15 UTC");
    setRegistered(true);
  };

  const handleSubmit = () => {
    setTxHash("0x" + Math.random().toString(16).slice(2, 10) + "..." + Math.random().toString(16).slice(2, 6));
    setTxTimestamp("2026-02-08 11:43:02 UTC");
    setSubmitted(true);
  };

  const contract = signedContracts.find(c => c.id === selectedContract);
  const canProceedStep1 = title.trim() && abstract.trim() && fileHash;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", background: "rgba(30,28,24,0.8)",
    border: "1px solid rgba(120,110,95,0.25)", borderRadius: 4,
    color: "#d4ccc0", fontFamily: "'Georgia', serif", fontSize: 13, outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = { fontSize: 11, color: "#8a8070", marginBottom: 6, display: "block" };

  const sectionStyle: React.CSSProperties = {
    background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.2)",
    borderRadius: 8, padding: 24, marginBottom: 20,
  };

  const HashDisplay = ({ label, hash }: { label: string; hash: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(30,28,24,0.4)", borderRadius: 4, marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: "#8a8070" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: hash ? "#5a7a9a" : "#3a3530", fontFamily: "monospace" }}>
          {hash ? hash.slice(0, 12) + "..." + hash.slice(-6) : "Not provided"}
        </span>
        {hash && <span style={{ fontSize: 10, color: "#6a6050", cursor: "pointer" }}>Copy</span>}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 40px" }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "#6a6050", marginBottom: 8 }}>
          <span style={{ cursor: "pointer" }}>Dashboard</span>
          <span style={{ margin: "0 8px" }}>/</span>
          <span style={{ color: "#8a8070" }}>Paper Registration & Submission</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 400, fontStyle: "italic", color: "#e8e0d4", margin: 0 }}>Paper Registration & Submission</h1>
        <p style={{ fontSize: 13, color: "#6a6050", marginTop: 6, fontStyle: "italic" }}>Timestamp your research on-chain and submit for peer review</p>
      </div>

      {/* Step Indicator */}
      <div style={{ marginTop: 28 }}>
        <StepIndicator steps={steps} current={step} />
      </div>

      {/* ---- Step 1: Paper Details ---- */}
      {step === 0 && (
        <div>
          <div style={sectionStyle}>
            <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 20 }}>Paper Details</div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Title <span style={{ color: "#d4645a" }}>*</span></label>
              <input type="text" placeholder="Enter paper title..." value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Abstract <span style={{ color: "#d4645a" }}>*</span></label>
              <textarea placeholder="Enter abstract..." value={abstract} onChange={e => setAbstract(e.target.value)} rows={5} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Paper File (PDF) <span style={{ color: "#d4645a" }}>*</span></label>
              <div style={{
                border: "2px dashed rgba(120,110,95,0.25)", borderRadius: 6, padding: fileName ? "14px 18px" : "32px 18px",
                textAlign: "center", cursor: "pointer", transition: "all 0.3s",
                background: fileName ? "rgba(120,180,120,0.04)" : "transparent",
              }} onClick={!fileName ? simulateFileUpload : undefined}>
                {fileName ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 13, color: "#d4ccc0", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{"\uD83D\uDCC4"}</span> {fileName}
                      </div>
                      <div style={{ fontSize: 10, color: "#5a7a9a", fontFamily: "monospace", marginTop: 4 }}>
                        SHA-256: {fileHash.slice(0, 16)}...{fileHash.slice(-8)}
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setFileName(""); setFileHash(""); }} style={{
                      background: "none", border: "1px solid rgba(120,110,95,0.2)", borderRadius: 3,
                      color: "#6a6050", padding: "4px 10px", fontSize: 10, cursor: "pointer",
                      fontFamily: "'Georgia', serif",
                    }}>Remove</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 24, color: "#4a4238", marginBottom: 8 }}>{"\u2B06"}</div>
                    <div style={{ fontSize: 13, color: "#6a6050" }}>Click to upload PDF</div>
                    <div style={{ fontSize: 10, color: "#4a4238", marginTop: 4 }}>SHA-256 hash computed client-side for transparency</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Visibility</label>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { key: "private", label: "Private Draft", desc: "Only hash recorded. Content not accessible to others." },
                  { key: "public", label: "Public Draft", desc: "Content accessible via the platform." },
                ].map(v => (
                  <button key={v.key} onClick={() => setVisibility(v.key)} style={{
                    flex: 1, padding: "12px 16px", textAlign: "left", cursor: "pointer",
                    background: visibility === v.key ? "rgba(180,160,120,0.08)" : "rgba(30,28,24,0.4)",
                    border: "1px solid " + (visibility === v.key ? "rgba(180,160,120,0.3)" : "rgba(120,110,95,0.12)"),
                    borderRadius: 6, transition: "all 0.3s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%",
                        border: "2px solid " + (visibility === v.key ? "#c9b89e" : "rgba(120,110,95,0.3)"),
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {visibility === v.key && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c9b89e" }} />}
                      </div>
                      <span style={{ fontSize: 13, color: visibility === v.key ? "#d4c8a8" : "#8a8070" }}>{v.label}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#5a5345", marginLeft: 24 }}>{v.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Research Fields / Keywords</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {keywords.map((k, i) => (
                  <span key={i} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
                    background: "rgba(120,110,95,0.12)", border: "1px solid rgba(120,110,95,0.2)",
                    borderRadius: 20, fontSize: 11, color: "#b0a898",
                  }}>
                    {k}
                    <span onClick={() => setKeywords(prev => prev.filter((_, j) => j !== i))} style={{ cursor: "pointer", color: "#6a6050", fontSize: 13 }}>{"\u2715"}</span>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="text" placeholder="Add keyword..." value={keywordInput} onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && keywordInput.trim()) { setKeywords(prev => [...prev, keywordInput.trim()]); setKeywordInput(""); } }}
                  style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => { if (keywordInput.trim()) { setKeywords(prev => [...prev, keywordInput.trim()]); setKeywordInput(""); } }} style={{
                  background: "rgba(120,110,95,0.1)", border: "1px solid rgba(120,110,95,0.2)",
                  borderRadius: 4, padding: "0 16px", color: "#8a8070", fontSize: 12, cursor: "pointer",
                  fontFamily: "'Georgia', serif",
                }}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Step 2: Provenance ---- */}
      {step === 1 && (
        <div>
          <div style={sectionStyle}>
            <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 20 }}>Provenance Linking</div>

            {/* Dataset */}
            <div style={{ marginBottom: 22, padding: 18, background: "rgba(30,28,24,0.4)", borderRadius: 6, border: "1px solid rgba(120,110,95,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#c9b89e" }}>Dataset</label>
                <span style={{ fontSize: 10, color: "#4a4238" }}>Optional</span>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ ...labelStyle, fontSize: 10 }}>SHA-256 Hash</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="text" placeholder="Enter dataset hash or upload to compute..." value={datasetHash} onChange={e => setDatasetHash(e.target.value)} style={{ ...inputStyle, flex: 1, fontFamily: "monospace", fontSize: 12 }} />
                  <button onClick={simulateDatasetUpload} style={{
                    background: "rgba(120,110,95,0.1)", border: "1px solid rgba(120,110,95,0.2)",
                    borderRadius: 4, padding: "0 14px", color: "#8a8070", fontSize: 11, cursor: "pointer",
                    fontFamily: "'Georgia', serif", whiteSpace: "nowrap",
                  }}>Upload</button>
                </div>
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: 10 }}>External URL (Zenodo, Figshare, etc.)</label>
                <input type="text" placeholder="https://zenodo.org/record/..." value={datasetUrl} onChange={e => setDatasetUrl(e.target.value)} style={{ ...inputStyle, fontSize: 12 }} />
              </div>
            </div>

            {/* Code Repository */}
            <div style={{ marginBottom: 22, padding: 18, background: "rgba(30,28,24,0.4)", borderRadius: 6, border: "1px solid rgba(120,110,95,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#c9b89e" }}>Code Repository</label>
                <span style={{ fontSize: 10, color: "#4a4238" }}>Optional</span>
              </div>
              {githubConnected ? (
                <div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 10,
                    background: "rgba(120,180,120,0.06)", border: "1px solid rgba(120,180,120,0.15)", borderRadius: 4,
                  }}>
                    <span style={{ color: "#8fbc8f" }}>{"\u2713"}</span>
                    <span style={{ fontSize: 11, color: "#8fbc8f" }}>GitHub connected</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ ...labelStyle, fontSize: 10 }}>Repository URL</label>
                    <input type="text" value={codeRepo} readOnly style={{ ...inputStyle, fontSize: 12, color: "#5a7a9a", fontFamily: "monospace" }} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 10 }}>Commit Hash (auto-fetched)</label>
                    <input type="text" value={codeCommit} readOnly style={{ ...inputStyle, fontSize: 12, color: "#5a7a9a", fontFamily: "monospace" }} />
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <input type="text" placeholder="Repository URL..." value={codeRepo} onChange={e => setCodeRepo(e.target.value)} style={{ ...inputStyle, flex: 1, fontSize: 12 }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <input type="text" placeholder="Git commit hash..." value={codeCommit} onChange={e => setCodeCommit(e.target.value)} style={{ ...inputStyle, flex: 1, fontFamily: "monospace", fontSize: 12 }} />
                  </div>
                  <button onClick={simulateGithub} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
                    background: "rgba(30,28,24,0.8)", border: "1px solid rgba(120,110,95,0.25)",
                    borderRadius: 4, color: "#b0a898", fontSize: 12, cursor: "pointer",
                    fontFamily: "'Georgia', serif",
                  }}>
                    <span style={{ fontSize: 16 }}>{"\u2B95"}</span> Connect GitHub
                  </button>
                </div>
              )}
            </div>

            {/* Environment */}
            <div style={{ marginBottom: 10, padding: 18, background: "rgba(30,28,24,0.4)", borderRadius: 6, border: "1px solid rgba(120,110,95,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#c9b89e" }}>Environment Specification</label>
                <span style={{ fontSize: 10, color: "#4a4238" }}>Optional</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="text" placeholder="Hash of Dockerfile or environment.yml..." value={envHash} onChange={e => setEnvHash(e.target.value)} style={{ ...inputStyle, flex: 1, fontFamily: "monospace", fontSize: 12 }} />
                <button onClick={simulateEnvUpload} style={{
                  background: "rgba(120,110,95,0.1)", border: "1px solid rgba(120,110,95,0.2)",
                  borderRadius: 4, padding: "0 14px", color: "#8a8070", fontSize: 11, cursor: "pointer",
                  fontFamily: "'Georgia', serif", whiteSpace: "nowrap",
                }}>Upload</button>
              </div>
              <div style={{ fontSize: 10, color: "#4a4238", marginTop: 6 }}>Upload a Dockerfile or environment.yml to auto-compute hash</div>
            </div>
          </div>

          {/* Provenance Summary */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Provenance Summary</div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 20,
              background: "rgba(30,28,24,0.4)", borderRadius: 6, border: "1px solid rgba(120,110,95,0.08)",
            }}>
              {[
                { label: "Paper", connected: !!fileHash, icon: "\uD83D\uDCC4" },
                { label: "Dataset", connected: !!datasetHash, icon: "\uD83D\uDDC3" },
                { label: "Code", connected: !!codeCommit, icon: "\u2B95" },
                { label: "Environment", connected: !!envHash, icon: "\u2699" },
              ].map((p, i, arr) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: p.connected ? "rgba(120,180,120,0.1)" : "rgba(120,110,95,0.08)",
                      border: "2px solid " + (p.connected ? "rgba(120,180,120,0.3)" : "rgba(120,110,95,0.15)"),
                      fontSize: 18, marginBottom: 4,
                    }}>{p.icon}</div>
                    <div style={{ fontSize: 9, color: p.connected ? "#8fbc8f" : "#4a4238", textTransform: "uppercase", letterSpacing: 0.5 }}>{p.label}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: 30, height: 2, background: "rgba(120,110,95,0.15)", margin: "0 4px 16px" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---- Step 3: Contract Linking ---- */}
      {step === 2 && (
        <div>
          <div style={sectionStyle}>
            <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 20 }}>Authorship Contract Linking</div>

            <div style={{
              padding: "10px 14px", marginBottom: 18, borderRadius: 4,
              background: "rgba(130,160,200,0.06)", border: "1px solid rgba(130,160,200,0.15)",
              fontSize: 11, color: "#7a9fc7",
            }}>
              Registration (timestamping) can proceed without a contract. Submission to a journal requires a fully signed contract.
            </div>

            <label style={labelStyle}>Select Fully Signed Contract</label>
            <select value={selectedContract || ""} onChange={e => setSelectedContract(e.target.value ? Number(e.target.value) : null)} style={{
              ...inputStyle, appearance: "none", cursor: "pointer", marginBottom: 16,
            }}>
              <option value="">-- No contract (register only) --</option>
              {signedContracts.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>

            {contract ? (
              <div style={{
                padding: 18, background: "rgba(30,28,24,0.4)", borderRadius: 6,
                border: "1px solid rgba(120,180,120,0.15)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <span style={{ color: "#8fbc8f" }}>{"\u2713"}</span>
                  <span style={{ fontSize: 12, color: "#8fbc8f" }}>Fully Signed Contract</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Paper</div>
                  <div style={{ fontSize: 13, color: "#d4ccc0" }}>{contract.title}</div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Contributors</div>
                  <div style={{ fontSize: 12, color: "#b0a898" }}>{contract.contributors}</div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Signed On</div>
                  <div style={{ fontSize: 12, color: "#8a8070" }}>{contract.date}</div>
                </div>
                <div style={{ fontSize: 10, color: "#5a7a9a", fontFamily: "monospace" }}>Contract hash: {contract.hash} {"\u2197"}</div>
              </div>
            ) : (
              <div style={{
                padding: 18, background: "rgba(30,28,24,0.3)", borderRadius: 6,
                border: "1px dashed rgba(120,110,95,0.2)", textAlign: "center",
              }}>
                <div style={{ fontSize: 12, color: "#6a6050", marginBottom: 8 }}>No contract selected</div>
                <div style={{ fontSize: 11, color: "#4a4238", marginBottom: 14 }}>You can still register your draft for timestamped proof of disclosure</div>
                <button style={{
                  background: "none", border: "1px solid rgba(130,160,200,0.25)",
                  borderRadius: 4, padding: "8px 18px", color: "#7a9fc7", fontSize: 12,
                  cursor: "pointer", fontFamily: "'Georgia', serif",
                }}>Create New Contract {"\u2192"}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Step 4: Register / Submit ---- */}
      {step === 3 && !registered && !submitted && (
        <div>
          {/* Summary */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>Submission Summary</div>
            <div style={{ fontSize: 14, color: "#e8e0d4", fontStyle: "italic", marginBottom: 16 }}>{title || "Untitled"}</div>
            <HashDisplay label="Paper" hash={fileHash} />
            <HashDisplay label="Dataset" hash={datasetHash} />
            <HashDisplay label="Code Commit" hash={codeCommit} />
            <HashDisplay label="Environment" hash={envHash} />
            <HashDisplay label="Contract" hash={contract ? contract.hash.replace("0x", "") + "0000" : ""} />
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 3, background: visibility === "private" ? "rgba(150,150,170,0.12)" : "rgba(120,180,120,0.12)", border: "1px solid " + (visibility === "private" ? "rgba(150,150,170,0.2)" : "rgba(120,180,120,0.2)"), color: visibility === "private" ? "#9a9aad" : "#8fbc8f" }}>
                {visibility === "private" ? "Private Draft" : "Public Draft"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 16 }}>
            {/* Register */}
            <div style={{
              flex: 1, padding: 24, borderRadius: 8, textAlign: "center",
              background: "rgba(45,42,38,0.5)", border: "1px solid rgba(180,160,120,0.25)",
            }}>
              <div style={{ fontSize: 14, color: "#d4c8a8", marginBottom: 6 }}>Register Draft</div>
              <div style={{ fontSize: 11, color: "#6a6050", marginBottom: 16, lineHeight: 1.6 }}>
                Timestamp your paper on Hedera. Records paper hash, author DID, ORCID, and provenance hashes. Always available.
              </div>
              <button onClick={handleRegister} style={{
                padding: "12px 28px",
                background: "linear-gradient(135deg, rgba(180,160,120,0.25), rgba(160,140,100,0.15))",
                border: "1px solid rgba(180,160,120,0.4)", borderRadius: 4,
                color: "#d4c8a8", fontFamily: "'Georgia', serif", fontSize: 14, cursor: "pointer",
              }}>Register on Hedera</button>
            </div>

            {/* Submit */}
            <div style={{
              flex: 1, padding: 24, borderRadius: 8, textAlign: "center",
              background: contract ? "rgba(120,180,120,0.04)" : "rgba(45,42,38,0.3)",
              border: "1px solid " + (contract ? "rgba(120,180,120,0.2)" : "rgba(120,110,95,0.15)"),
              opacity: contract ? 1 : 0.6,
            }}>
              <div style={{ fontSize: 14, color: contract ? "#8fbc8f" : "#4a4238", marginBottom: 6 }}>Submit to Journal</div>
              <div style={{ fontSize: 11, color: "#6a6050", marginBottom: contract ? 12 : 16, lineHeight: 1.6 }}>
                {contract ? "Submit your registered paper for peer review." : "Requires a fully signed authorship contract."}
              </div>
              {contract && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ ...labelStyle, fontSize: 10 }}>Select Journal</label>
                  <select value={selectedJournal || ""} onChange={e => setSelectedJournal(e.target.value ? Number(e.target.value) : null)} style={{
                    ...inputStyle, appearance: "none", cursor: "pointer", textAlign: "center", maxWidth: 280, margin: "0 auto",
                  }}>
                    <option value="">-- Choose journal --</option>
                    {registeredJournals.map(j => (
                      <option key={j.id} value={j.id}>{j.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <button onClick={contract && selectedJournal ? handleSubmit : undefined} disabled={!contract || !selectedJournal} style={{
                padding: "12px 28px",
                background: contract && selectedJournal ? "linear-gradient(135deg, rgba(120,180,120,0.25), rgba(100,160,100,0.15))" : "rgba(120,110,95,0.1)",
                border: "1px solid " + (contract && selectedJournal ? "rgba(120,180,120,0.4)" : "rgba(120,110,95,0.15)"),
                borderRadius: 4, color: contract && selectedJournal ? "#8fbc8f" : "#4a4238",
                fontFamily: "'Georgia', serif", fontSize: 14, cursor: contract && selectedJournal ? "pointer" : "not-allowed",
              }}>Submit for Review</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Confirmation Screen ---- */}
      {(registered || submitted) && step === 3 && (
        <div style={{
          ...sectionStyle, textAlign: "center", padding: 40,
          background: submitted ? "rgba(120,180,120,0.04)" : "rgba(180,160,120,0.04)",
          border: "1px solid " + (submitted ? "rgba(120,180,120,0.2)" : "rgba(180,160,120,0.2)"),
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{"\u2713"}</div>
          <div style={{ fontSize: 20, color: "#e8e0d4", fontStyle: "italic", marginBottom: 6 }}>
            {submitted ? "Paper Submitted" : "Draft Registered"}
          </div>
          <div style={{ fontSize: 12, color: "#8a8070", marginBottom: 24 }}>
            {submitted ? "Your paper has been submitted for peer review and recorded on Hedera." : "Your draft has been timestamped on Hedera for proof of first disclosure."}
          </div>

          <div style={{
            display: "inline-block", textAlign: "left", padding: 20, background: "rgba(30,28,24,0.5)",
            borderRadius: 6, border: "1px solid rgba(120,110,95,0.15)", minWidth: 360,
          }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Transaction Hash</div>
              <div style={{ fontSize: 13, color: "#5a7a9a", fontFamily: "monospace", cursor: "pointer" }}>{txHash} {"\u2197"}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Timestamp</div>
              <div style={{ fontSize: 13, color: "#d4ccc0" }}>{txTimestamp}</div>
            </div>
            <HashDisplay label="Paper Hash" hash={fileHash} />
            <HashDisplay label="Dataset" hash={datasetHash} />
            <HashDisplay label="Code" hash={codeCommit} />
            <HashDisplay label="Environment" hash={envHash} />
            {contract && <HashDisplay label="Contract" hash={contract.hash.replace("0x", "") + "0000"} />}
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
            <button style={{
              padding: "10px 24px", background: "linear-gradient(135deg, rgba(180,160,120,0.2), rgba(160,140,100,0.1))",
              border: "1px solid rgba(180,160,120,0.3)", borderRadius: 4,
              color: "#d4c8a8", fontFamily: "'Georgia', serif", fontSize: 13, cursor: "pointer",
            }}>View Paper {"\u2192"}</button>
            <button style={{
              padding: "10px 24px", background: "none",
              border: "1px solid rgba(120,110,95,0.2)", borderRadius: 4,
              color: "#8a8070", fontFamily: "'Georgia', serif", fontSize: 13, cursor: "pointer",
            }}>Return to Dashboard</button>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      {!(registered || submitted) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
          <button onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0} style={{
            padding: "10px 24px", background: "none",
            border: "1px solid " + (step > 0 ? "rgba(120,110,95,0.25)" : "rgba(120,110,95,0.1)"),
            borderRadius: 4, color: step > 0 ? "#8a8070" : "#3a3530",
            fontFamily: "'Georgia', serif", fontSize: 13, cursor: step > 0 ? "pointer" : "not-allowed",
          }}>{"\u2190"} Back</button>
          {step < 3 && (
            <button onClick={() => setStep(step + 1)} disabled={step === 0 && !canProceedStep1} style={{
              padding: "10px 24px",
              background: (step === 0 && !canProceedStep1) ? "rgba(120,110,95,0.1)" : "linear-gradient(135deg, rgba(180,160,120,0.2), rgba(160,140,100,0.1))",
              border: "1px solid " + ((step === 0 && !canProceedStep1) ? "rgba(120,110,95,0.15)" : "rgba(180,160,120,0.3)"),
              borderRadius: 4, color: (step === 0 && !canProceedStep1) ? "#4a4238" : "#d4c8a8",
              fontFamily: "'Georgia', serif", fontSize: 13, cursor: (step === 0 && !canProceedStep1) ? "not-allowed" : "pointer",
            }}>Next {"\u2192"}</button>
          )}
        </div>
      )}
    </div>
  );
}
