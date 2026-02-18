"use client";

import { useState } from "react";

const allPapers = [
  { id: 1, title: "On the Reproducibility of Transformer Architectures in Low-Resource Settings", authors: [{ name: "A. Reeves", pct: 40, orcid: "0000-0001-2345-6789", role: "Lead author, experimental design" }, { name: "M. Chen", pct: 35, orcid: "0000-0002-3456-7890", role: "Analysis, writing" }, { name: "L. Vasquez", pct: 25, orcid: "0000-0003-4567-8901", role: "Data collection" }], status: "Published", journal: "Journal of Computational Research", field: "Machine Learning", date: "2025-11-02", abstract: "We present a comprehensive study on the reproducibility challenges of transformer architectures when applied to low-resource language settings. Our methodology introduces controlled benchmarking protocols and demonstrates that standard training practices lead to significant variance in downstream task performance. We propose a normalization framework that reduces variance by 47% across five language pairs.", paperHash: "a3f7c9e1b2d84056e9f1a7b3c2d5e8f01a2b3c4d5e6f7890", datasetHash: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a90b1c2d3e4f5a6b7c", codeCommit: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6", envHash: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8", contractHash: "fa912c3d4e5f6a7b8c9d0e1f2a3b4c5d", txHash: "0x3a9fc2e1", regTimestamp: "2025-10-15 09:23:41 UTC", codeUrl: "https://github.com/areeves/transformer-reproducibility", datasetUrl: "https://zenodo.org/record/12345", visibility: "public", versions: [{ v: "v1", date: "2025-10-15", label: "Draft", hash: "a3f7c9...7890" }, { v: "v2", date: "2025-10-28", label: "Submitted", hash: "b4g8d0...8901", note: "Revised statistical methods" }, { v: "v3", date: "2025-11-02", label: "Published", hash: "c5h9e1...9012", note: "Camera-ready" }], reviews: [{ reviewer: "Reviewer #1 (R-4821)", rec: "Accept", criteria: [{ label: "Methodology is reproducible", met: "Yes" }, { label: "Statistical analysis is appropriate", met: "Yes" }, { label: "Dataset is accessible and described", met: "Yes" }, { label: "Claims are supported by evidence", met: "Partially" }, { label: "Related work is adequately cited", met: "Yes" }], strengths: "Strong experimental design with comprehensive benchmarking across multiple language pairs.", weaknesses: "Some claims in Section 5.3 could benefit from additional statistical tests." }, { reviewer: "Reviewer #2 (R-7293)", rec: "Minor Revisions", criteria: [{ label: "Methodology is reproducible", met: "Yes" }, { label: "Statistical analysis is appropriate", met: "Partially" }, { label: "Dataset is accessible and described", met: "Yes" }, { label: "Claims are supported by evidence", met: "Yes" }, { label: "Related work is adequately cited", met: "Yes" }], strengths: "Novel normalization framework with clear practical implications.", weaknesses: "Minor: Missing comparison with recent work by Zhou et al. (2025)." }], decision: "Accepted", retracted: false },
  { id: 2, title: "Causal Inference Methods for Observational Climate Data", authors: [{ name: "A. Reeves", pct: 60, orcid: "0000-0001-2345-6789", role: "Lead author" }, { name: "R. Okafor", pct: 40, orcid: "0000-0004-5678-9012", role: "Climate data analysis" }], status: "Under Review", journal: "Nature Climate Science", field: "Climate Science", date: "2025-12-18", abstract: "This paper proposes novel causal inference techniques tailored for high-dimensional, temporally correlated observational climate datasets. We demonstrate improved causal discovery accuracy over existing methods on both synthetic and real-world atmospheric data.", paperHash: "7b2df8914a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b", datasetHash: "1122334455667788", codeCommit: "f1e2d3c4b5a69788", envHash: "", contractHash: "bb347d21e3f4a5b6", txHash: "0x7b2df891", regTimestamp: "2025-12-18 14:07:22 UTC", codeUrl: "https://github.com/areeves/causal-climate", datasetUrl: "", visibility: "public", versions: [{ v: "v1", date: "2025-12-18", label: "Submitted", hash: "7b2d...f891" }], reviews: [], decision: null, retracted: false },
  { id: 3, title: "Topological Data Analysis for Gene Regulatory Networks", authors: [{ name: "P. Moreau", pct: 55, orcid: "0000-0005-1234-5678", role: "Lead author, TDA methods" }, { name: "J. Singh", pct: 45, orcid: "0000-0006-8765-4321", role: "Biological validation" }], status: "Under Review", journal: "Journal of Computational Research", field: "Computational Biology", date: "2026-01-05", abstract: "We apply persistent homology and mapper algorithms to uncover topological features in gene regulatory network dynamics, revealing previously uncharacterized feedback loop structures in mammalian cell differentiation pathways.", paperHash: "f1a0e4b29c3d5e6f7a8b9c0d1e2f3a4b", datasetHash: "aabb112233cc4455", codeCommit: "9a8b7c6d5e4f3a2b", envHash: "dd11ee22ff33aa44", contractHash: "cc5599887766dd22", txHash: "0xf1a0e4b2", regTimestamp: "2026-01-05 11:55:30 UTC", codeUrl: "", datasetUrl: "https://figshare.com/articles/98765", visibility: "public", versions: [{ v: "v1", date: "2026-01-05", label: "Submitted", hash: "f1a0...e4b2" }], reviews: [], decision: null, retracted: false },
  { id: 4, title: "Privacy-Preserving Federated Learning via Differential Privacy", authors: [{ name: "K. Tanaka", pct: 50, orcid: "0000-0002-8765-4321", role: "Algorithm design" }, { name: "L. Fernandez", pct: 50, orcid: "0000-0007-2345-6789", role: "Privacy analysis" }], status: "Published", journal: "ICML Proceedings", field: "Machine Learning", date: "2025-09-10", abstract: "We propose a novel differential privacy mechanism for federated learning that achieves near-optimal utility-privacy tradeoffs under heterogeneous data distributions.", paperHash: "bb347d21aabb1122", datasetHash: "5566778899aabb00", codeCommit: "1a2b3c4d5e6f7a8b", envHash: "99887766554433ee", contractHash: "dd44ee55ff66aa77", txHash: "0xbb347d21", regTimestamp: "2025-09-10 08:12:55 UTC", codeUrl: "https://github.com/ktanaka/federated-dp", datasetUrl: "", visibility: "public", versions: [{ v: "v1", date: "2025-08-20", label: "Draft", hash: "aa11...bb22" }, { v: "v2", date: "2025-09-10", label: "Published", hash: "bb34...7d21", note: "Added privacy proofs" }], reviews: [{ reviewer: "Reviewer #1", rec: "Accept", criteria: [{ label: "Methodology is reproducible", met: "Yes" }, { label: "Statistical analysis is appropriate", met: "Yes" }, { label: "Claims are supported by evidence", met: "Yes" }], strengths: "Rigorous theoretical analysis with strong experimental validation.", weaknesses: "Limited discussion of computational overhead." }], decision: "Accepted", retracted: false },
  { id: 5, title: "Continual Learning Without Catastrophic Forgetting in Vision Transformers", authors: [{ name: "D. Osei", pct: 60, orcid: "0000-0008-1111-2222", role: "Architecture design" }, { name: "R. Gupta", pct: 40, orcid: "0000-0009-3333-4444", role: "Experiments" }], status: "Retracted", journal: "Journal of Computational Research", field: "Computer Vision", date: "2025-08-22", abstract: "We proposed a memory-augmented vision transformer for continual learning. [RETRACTED: Dataset contamination discovered in evaluation benchmarks.]", paperHash: "56efa912cc33dd44", datasetHash: "ee55ff66aa77bb88", codeCommit: "2b3c4d5e6f7a8b9c", envHash: "", contractHash: "1122aabb3344ccdd", txHash: "0x56efa912", regTimestamp: "2025-08-22 16:40:11 UTC", codeUrl: "", datasetUrl: "", visibility: "public", versions: [{ v: "v1", date: "2025-08-22", label: "Submitted", hash: "56ef...a912" }, { v: "v2", date: "2025-10-01", label: "Retracted", hash: "56ef...a912", note: "Dataset contamination" }], reviews: [], decision: "Retracted", retracted: true, retractionReason: "Dataset contamination discovered in evaluation benchmarks. Training data contained samples from test set.", retractionParty: "Authors (self-retraction)", retractionComponent: "Data" },
];

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  "Published": { bg: "rgba(120,180,120,0.15)", text: "#8fbc8f", border: "rgba(120,180,120,0.3)" },
  "Under Review": { bg: "rgba(180,180,120,0.15)", text: "#c9b458", border: "rgba(180,180,120,0.3)" },
  "Retracted": { bg: "rgba(200,100,90,0.15)", text: "#d4645a", border: "rgba(200,100,90,0.3)" },
  "Draft": { bg: "rgba(150,150,170,0.15)", text: "#9a9aad", border: "rgba(150,150,170,0.3)" },
  "Registered": { bg: "rgba(130,160,200,0.15)", text: "#7a9fc7", border: "rgba(130,160,200,0.3)" },
};

const Badge = ({ status }: { status: string }) => {
  const c = statusColors[status] || statusColors["Draft"];
  return (
    <span style={{
      background: c.bg, color: c.text, border: "1px solid " + c.border,
      padding: "3px 10px", borderRadius: 3, fontSize: 11, letterSpacing: 0.5,
      fontFamily: "'Georgia', serif", whiteSpace: "nowrap",
    }}>{status}</span>
  );
};

const HashRow = ({ label, hash, url }: { label: string; hash: string; url?: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(120,110,95,0.06)" }}>
    <span style={{ fontSize: 11, color: "#8a8070" }}>{label}</span>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: hash ? "#5a7a9a" : "#3a3530", fontFamily: "monospace" }}>
        {hash ? (hash.length > 20 ? hash.slice(0, 12) + "..." + hash.slice(-6) : hash) : "N/A"}
      </span>
      {hash && <span style={{ fontSize: 10, color: "#c9b89e", cursor: "pointer" }}>Verify {"\u2197"}</span>}
      {url && <span style={{ fontSize: 10, color: "#7a9fc7", cursor: "pointer" }}>Source {"\u2197"}</span>}
    </div>
  </div>
);

export default function PaperExplorer() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fieldFilter, setFieldFilter] = useState("All");
  const [selectedPaper, setSelectedPaper] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState("overview");
  const [sortBy, setSortBy] = useState("newest");

  const fields = ["All", ...new Set(allPapers.map(p => p.field))];
  const statuses = ["All", "Published", "Under Review", "Retracted"];

  let filtered = allPapers.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.abstract.toLowerCase().includes(q) || p.authors.some(a => a.name.toLowerCase().includes(q) || a.orcid.includes(q)) || p.paperHash.includes(q);
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    const matchField = fieldFilter === "All" || p.field === fieldFilter;
    return matchSearch && matchStatus && matchField;
  });

  if (sortBy === "newest") filtered.sort((a, b) => b.date.localeCompare(a.date));
  else filtered.sort((a, b) => a.date.localeCompare(b.date));

  const paper = allPapers.find(p => p.id === selectedPaper);

  return (
    <>
      {!paper ? (
        /* ========== EXPLORER VIEW ========== */
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 40px" }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 400, fontStyle: "italic", color: "#e8e0d4", margin: 0 }}>Explore Papers</h1>
            <p style={{ fontSize: 13, color: "#6a6050", marginTop: 6, fontStyle: "italic" }}>Discover verified research with on-chain provenance</p>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 20 }}>
            <input type="text" placeholder="Search by title, author, ORCID, or paper hash..." value={search} onChange={e => setSearch(e.target.value)} style={{
              width: "100%", padding: "14px 18px 14px 42px", background: "rgba(45,42,38,0.6)",
              border: "1px solid rgba(120,110,95,0.25)", borderRadius: 6,
              color: "#d4ccc0", fontFamily: "'Georgia', serif", fontSize: 14, outline: "none", boxSizing: "border-box",
            }} />
            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#6a6050", fontSize: 16 }}>{"\u2315"}</span>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {statuses.map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  background: statusFilter === s ? "rgba(180,160,120,0.15)" : "transparent",
                  border: "1px solid " + (statusFilter === s ? "rgba(180,160,120,0.3)" : "rgba(120,110,95,0.15)"),
                  color: statusFilter === s ? "#c9b89e" : "#6a6050", borderRadius: 3,
                  padding: "5px 12px", fontSize: 11, fontFamily: "'Georgia', serif", cursor: "pointer",
                }}>{s}</button>
              ))}
              <span style={{ width: 1, background: "rgba(120,110,95,0.15)", margin: "0 4px" }} />
              {fields.map(f => (
                <button key={f} onClick={() => setFieldFilter(f)} style={{
                  background: fieldFilter === f ? "rgba(180,160,120,0.15)" : "transparent",
                  border: "1px solid " + (fieldFilter === f ? "rgba(180,160,120,0.3)" : "rgba(120,110,95,0.15)"),
                  color: fieldFilter === f ? "#c9b89e" : "#6a6050", borderRadius: 3,
                  padding: "5px 12px", fontSize: 11, fontFamily: "'Georgia', serif", cursor: "pointer",
                }}>{f}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {["newest", "oldest"].map(s => (
                <button key={s} onClick={() => setSortBy(s)} style={{
                  background: sortBy === s ? "rgba(120,110,95,0.2)" : "transparent",
                  border: "1px solid rgba(120,110,95,0.12)", borderRadius: 3, padding: "4px 10px",
                  color: sortBy === s ? "#c9b89e" : "#4a4238", fontSize: 10, cursor: "pointer",
                  fontFamily: "'Georgia', serif", textTransform: "capitalize",
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => { setSelectedPaper(p.id); setDetailTab("overview"); }} style={{
                padding: "18px 22px", background: "rgba(45,42,38,0.4)",
                border: "1px solid rgba(120,110,95,0.12)", borderRadius: 6,
                cursor: "pointer", transition: "all 0.2s",
                borderLeft: p.retracted ? "3px solid #d4645a" : "3px solid transparent",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, color: "#e8e0d4", lineHeight: 1.4, marginBottom: 6 }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: "#8a8070" }}>
                      {p.authors.map(a => a.name).join(", ")}
                    </div>
                  </div>
                  <Badge status={p.status} />
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#6a6050" }}>{p.journal}</span>
                  <span style={{ fontSize: 11, color: "#4a4238" }}>{"\u2022"}</span>
                  <span style={{ fontSize: 11, color: "#6a6050" }}>{p.field}</span>
                  <span style={{ fontSize: 11, color: "#4a4238" }}>{"\u2022"}</span>
                  <span style={{ fontSize: 11, color: "#6a6050" }}>{p.date}</span>
                  <span style={{ fontSize: 11, color: "#4a4238" }}>{"\u2022"}</span>
                  <span style={{ fontSize: 10, color: "#5a7a9a", fontFamily: "monospace" }}>{p.txHash}</span>
                  <span style={{ fontSize: 10, color: "#8fbc8f" }}>{"\u2713"} Verified</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#6a6050", fontStyle: "italic" }}>No papers match your search</div>
            )}
          </div>
        </div>
      ) : (
        /* ========== PAPER DETAIL VIEW ========== */
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 40px" }}>
          {/* Back */}
          <button onClick={() => setSelectedPaper(null)} style={{
            background: "none", border: "none", color: "#6a6050", fontSize: 12,
            cursor: "pointer", fontFamily: "'Georgia', serif", padding: 0, marginBottom: 20,
            display: "flex", alignItems: "center", gap: 6,
          }}>{"\u2190"} Back to Explorer</button>

          {/* Retraction Banner */}
          {paper.retracted && (
            <div style={{
              padding: "16px 20px", marginBottom: 20, borderRadius: 6,
              background: "rgba(200,100,90,0.1)", border: "1px solid rgba(200,100,90,0.3)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18, color: "#d4645a" }}>{"\u26A0"}</span>
                <span style={{ fontSize: 15, color: "#d4645a", fontWeight: 600 }}>This paper has been retracted</span>
              </div>
              <div style={{ fontSize: 12, color: "#b08070", lineHeight: 1.6, marginBottom: 8 }}>{paper.retractionReason}</div>
              <div style={{ display: "flex", gap: 20, fontSize: 11, color: "#8a6050" }}>
                <span>Requesting party: {paper.retractionParty}</span>
                <span>Failed component: {paper.retractionComponent}</span>
              </div>
              <div style={{ fontSize: 10, color: "#5a7a9a", fontFamily: "monospace", marginTop: 8, cursor: "pointer" }}>View retraction on-chain {"\u2197"}</div>
            </div>
          )}

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Badge status={paper.status} />
              {paper.journal && <span style={{ fontSize: 12, color: "#8a8070" }}>{paper.journal}</span>}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 400, fontStyle: "italic", color: paper.retracted ? "#8a6050" : "#e8e0d4", margin: 0, lineHeight: 1.4, textDecoration: paper.retracted ? "line-through" : "none" }}>{paper.title}</h1>
            <div style={{ marginTop: 10, fontSize: 11, color: "#5a7a9a", fontFamily: "monospace" }}>
              Registered: {paper.regTimestamp} {"\u2022"} Tx: {paper.txHash} {"\u2197"}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(120,110,95,0.2)", marginBottom: 24 }}>
            {["overview", "provenance", "versions", "reviews"].map(t => (
              <button key={t} onClick={() => setDetailTab(t)} style={{
                background: "none", border: "none",
                borderBottom: detailTab === t ? "2px solid #c9b89e" : "2px solid transparent",
                color: detailTab === t ? "#c9b89e" : "#6a6050", padding: "10px 20px",
                fontFamily: "'Georgia', serif", fontSize: 13, cursor: "pointer",
                textTransform: "capitalize", letterSpacing: 0.5, transition: "all 0.3s",
              }}>{t}{t === "reviews" && paper.reviews.length > 0 ? ` (${paper.reviews.length})` : ""}</button>
            ))}
          </div>

          {/* Overview Tab */}
          {detailTab === "overview" && (
            <div>
              <div style={{
                background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.15)",
                borderRadius: 8, padding: 22, marginBottom: 20,
              }}>
                <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Authors & Contributions</div>
                {paper.authors.map((a, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0", borderBottom: i < paper.authors.length - 1 ? "1px solid rgba(120,110,95,0.08)" : "none",
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, color: "#d4ccc0" }}>{a.name}</span>
                        <span style={{ fontSize: 10, color: "#7a9fc7", cursor: "pointer" }}>ORCID: {a.orcid} {"\u2197"}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#6a6050", marginTop: 2 }}>{a.role}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 60, height: 4, background: "rgba(120,110,95,0.15)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: a.pct + "%", height: "100%", background: "#c9b89e", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 14, color: "#c9b89e", fontFamily: "sans-serif", fontWeight: 600, minWidth: 36, textAlign: "right" }}>{a.pct}%</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 12, fontSize: 10, color: "#5a7a9a", fontFamily: "monospace", cursor: "pointer" }}>
                  Contract: {paper.contractHash.slice(0, 8)}...{paper.contractHash.slice(-4)} {"\u2022"} View on Hedera {"\u2197"}
                </div>
              </div>

              <div style={{
                background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.15)",
                borderRadius: 8, padding: 22, marginBottom: 20,
              }}>
                <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Abstract</div>
                <div style={{ fontSize: 13, color: "#b0a898", lineHeight: 1.7 }}>{paper.abstract}</div>
                {paper.visibility === "public" && (
                  <button style={{
                    marginTop: 14, background: "none", border: "1px solid rgba(180,160,120,0.25)",
                    borderRadius: 4, padding: "8px 18px", color: "#c9b89e", fontSize: 12,
                    cursor: "pointer", fontFamily: "'Georgia', serif",
                  }}>View Full Paper {"\u2197"}</button>
                )}
                {paper.visibility === "private" && (
                  <div style={{ marginTop: 14, fontSize: 11, color: "#6a6050", fontStyle: "italic" }}>
                    Content is private. Hash recorded on-chain for proof of disclosure.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Provenance Tab */}
          {detailTab === "provenance" && (
            <div>
              <div style={{
                background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.15)",
                borderRadius: 8, padding: 22,
              }}>
                <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>On-Chain Provenance</div>

                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 20, marginBottom: 20,
                  background: "rgba(30,28,24,0.4)", borderRadius: 6, border: "1px solid rgba(120,110,95,0.08)",
                }}>
                  {[
                    { label: "Paper", connected: true },
                    { label: "Dataset", connected: !!paper.datasetHash },
                    { label: "Code", connected: !!paper.codeCommit },
                    { label: "Environment", connected: !!paper.envHash },
                  ].map((p2, i, arr) => (
                    <div key={i} style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          background: p2.connected ? "rgba(120,180,120,0.1)" : "rgba(120,110,95,0.08)",
                          border: "2px solid " + (p2.connected ? "rgba(120,180,120,0.3)" : "rgba(120,110,95,0.15)"),
                          fontSize: 13, color: p2.connected ? "#8fbc8f" : "#4a4238",
                        }}>{p2.connected ? "\u2713" : "\u2013"}</div>
                        <div style={{ fontSize: 10, color: p2.connected ? "#8fbc8f" : "#4a4238", marginTop: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{p2.label}</div>
                      </div>
                      {i < arr.length - 1 && <div style={{ width: 30, height: 2, background: "rgba(120,110,95,0.15)", margin: "0 4px 20px" }} />}
                    </div>
                  ))}
                </div>

                <HashRow label="Paper Hash" hash={paper.paperHash} />
                <HashRow label="Dataset Hash" hash={paper.datasetHash} url={paper.datasetUrl} />
                <HashRow label="Code Commit" hash={paper.codeCommit} url={paper.codeUrl} />
                <HashRow label="Environment Hash" hash={paper.envHash} />
                <HashRow label="Contract Hash" hash={paper.contractHash} />

                <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(120,180,120,0.04)", borderRadius: 4, border: "1px solid rgba(120,180,120,0.1)", fontSize: 11, color: "#6a6050", lineHeight: 1.6 }}>
                  All hashes are immutably recorded on Hedera and independently verifiable. Click &quot;Verify&quot; on any hash to view its transaction on the Hedera explorer.
                </div>
              </div>
            </div>
          )}

          {/* Versions Tab */}
          {detailTab === "versions" && (
            <div>
              <div style={{
                background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.15)",
                borderRadius: 8, padding: 22,
              }}>
                <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 20 }}>Version History</div>

                <div style={{ position: "relative", paddingLeft: 28 }}>
                  <div style={{ position: "absolute", left: 9, top: 10, bottom: 10, width: 2, background: "rgba(120,110,95,0.15)" }} />
                  {paper.versions.map((v, i) => {
                    const isLatest = i === paper.versions.length - 1;
                    const vColor = v.label === "Published" ? "#8fbc8f" : v.label === "Retracted" ? "#d4645a" : v.label === "Submitted" ? "#c9b458" : "#9a9aad";
                    return (
                      <div key={i} style={{ position: "relative", marginBottom: 24 }}>
                        <div style={{
                          position: "absolute", left: -28, top: 4, width: 20, height: 20, borderRadius: "50%",
                          background: isLatest ? (v.label === "Retracted" ? "rgba(200,100,90,0.2)" : "rgba(120,180,120,0.2)") : "rgba(120,110,95,0.1)",
                          border: "2px solid " + (isLatest ? vColor : "rgba(120,110,95,0.2)"),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, color: vColor,
                        }}>{isLatest ? (v.label === "Retracted" ? "\u2715" : "\u2713") : ""}</div>
                        <div style={{
                          padding: "14px 18px", background: isLatest ? "rgba(120,110,95,0.06)" : "transparent",
                          border: "1px solid " + (isLatest ? "rgba(120,110,95,0.15)" : "rgba(120,110,95,0.06)"),
                          borderRadius: 6,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 14, color: "#d4ccc0", fontWeight: 600 }}>{v.v}</span>
                              <span style={{
                                fontSize: 10, padding: "2px 8px", borderRadius: 3,
                                background: "rgba(120,110,95,0.1)", color: vColor,
                                border: "1px solid rgba(120,110,95,0.15)",
                              }}>{v.label}</span>
                            </div>
                            <span style={{ fontSize: 11, color: "#6a6050" }}>{v.date}</span>
                          </div>
                          {v.note && <div style={{ fontSize: 11, color: "#8a8070", marginBottom: 4 }}>{v.note}</div>}
                          <div style={{ fontSize: 10, color: "#5a7a9a", fontFamily: "monospace" }}>Hash: {v.hash}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {detailTab === "reviews" && (
            <div>
              {paper.reviews.length === 0 ? (
                <div style={{
                  padding: 40, textAlign: "center", background: "rgba(45,42,38,0.5)",
                  border: "1px solid rgba(120,110,95,0.15)", borderRadius: 8,
                }}>
                  <div style={{ fontSize: 14, color: "#6a6050", fontStyle: "italic" }}>
                    {paper.status === "Under Review" ? "Reviews are in progress" : "No reviews available"}
                  </div>
                </div>
              ) : (
                <div>
                  {paper.decision && (
                    <div style={{
                      padding: "14px 20px", marginBottom: 16, borderRadius: 6,
                      background: paper.decision === "Accepted" ? "rgba(120,180,120,0.06)" : "rgba(200,100,90,0.06)",
                      border: "1px solid " + (paper.decision === "Accepted" ? "rgba(120,180,120,0.2)" : "rgba(200,100,90,0.2)"),
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <span style={{ fontSize: 13, color: paper.decision === "Accepted" ? "#8fbc8f" : "#d4645a", fontWeight: 600 }}>
                          Decision: {paper.decision}
                        </span>
                      </div>
                      <span style={{ fontSize: 10, color: "#5a7a9a", fontFamily: "monospace", cursor: "pointer" }}>View on-chain {"\u2197"}</span>
                    </div>
                  )}

                  <div style={{
                    padding: "10px 16px", marginBottom: 16, borderRadius: 4,
                    background: "rgba(130,160,200,0.06)", border: "1px solid rgba(130,160,200,0.15)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 11, color: "#7a9fc7" }}>Pre-registered review criteria published on-chain</span>
                    <span style={{ fontSize: 10, color: "#5a7a9a", fontFamily: "monospace", cursor: "pointer" }}>View criteria {"\u2197"}</span>
                  </div>

                  {paper.reviews.map((r, ri) => (
                    <div key={ri} style={{
                      background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.15)",
                      borderRadius: 8, padding: 22, marginBottom: 14,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <span style={{ fontSize: 13, color: "#d4ccc0" }}>{r.reviewer}</span>
                        <span style={{
                          fontSize: 11, padding: "3px 10px", borderRadius: 3,
                          background: r.rec === "Accept" ? "rgba(120,180,120,0.12)" : "rgba(180,180,120,0.12)",
                          color: r.rec === "Accept" ? "#8fbc8f" : "#c9b458",
                          border: "1px solid " + (r.rec === "Accept" ? "rgba(120,180,120,0.25)" : "rgba(180,180,120,0.25)"),
                        }}>{r.rec}</span>
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Criteria Evaluation</div>
                        {r.criteria.map((c, ci) => (
                          <div key={ci} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "6px 0", borderBottom: ci < r.criteria.length - 1 ? "1px solid rgba(120,110,95,0.06)" : "none",
                          }}>
                            <span style={{ fontSize: 12, color: "#b0a898" }}>{c.label}</span>
                            <span style={{
                              fontSize: 11, fontWeight: 600,
                              color: c.met === "Yes" ? "#8fbc8f" : c.met === "Partially" ? "#c9b458" : "#d4645a",
                            }}>{c.met}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#8fbc8f", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Strengths</div>
                        <div style={{ fontSize: 12, color: "#8a8070", lineHeight: 1.5 }}>{r.strengths}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#d4a45a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Weaknesses</div>
                        <div style={{ fontSize: 12, color: "#8a8070", lineHeight: 1.5 }}>{r.weaknesses}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
