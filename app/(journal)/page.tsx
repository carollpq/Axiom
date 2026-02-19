import { useState } from "react";

const submissions = [
  { id: 1, title: "On the Reproducibility of Transformer Architectures in Low-Resource Settings", authors: "A. Reeves, M. Chen, L. Vasquez", submitted: "2025-10-15", stage: "Published", reviewers: ["R-4821", "R-7293"], deadline: "2025-11-15", criteriaPublished: true, criteriaMet: true, hash: "0x3a9f...c2e1" },
  { id: 2, title: "Causal Inference Methods for Observational Climate Data", authors: "A. Reeves, R. Okafor", submitted: "2025-12-18", stage: "Under Review", reviewers: ["R-1156", "R-8830"], deadline: "2026-02-18", criteriaPublished: true, criteriaMet: null, hash: "0x7b2d...f891" },
  { id: 3, title: "Topological Data Analysis for Gene Regulatory Networks", authors: "P. Moreau, J. Singh", submitted: "2026-01-05", stage: "Reviewers Assigned", reviewers: ["R-3342"], deadline: "2026-03-05", criteriaPublished: true, criteriaMet: null, hash: "0xf1a0...e4b2" },
  { id: 4, title: "Efficient Sparse Attention for Long Document Summarization", authors: "H. Liu, S. Park", submitted: "2026-01-20", stage: "Criteria Published", reviewers: [], deadline: "2026-03-20", criteriaPublished: true, criteriaMet: null, hash: "0x82cd...51a9" },
  { id: 5, title: "Robustness of Diffusion Models under Distribution Shift", authors: "T. Nakamura, Y. Zhao", submitted: "2026-02-01", stage: "New", reviewers: [], deadline: null, criteriaPublished: false, criteriaMet: null, hash: "0xd9e3...b7f0" },
  { id: 6, title: "Neural Symbolic Integration for Mathematical Reasoning", authors: "C. Weber, M. Ali", submitted: "2026-02-04", stage: "New", reviewers: [], deadline: null, criteriaPublished: false, criteriaMet: null, hash: "0xa4b1...c3d8" },
  { id: 7, title: "Privacy-Preserving Federated Learning via Differential Privacy", authors: "K. Tanaka, L. Fernandez", submitted: "2025-09-10", stage: "Decision Pending", reviewers: ["R-4821", "R-5567", "R-1156"], deadline: "2025-11-10", criteriaPublished: true, criteriaMet: true, hash: "0xbb34...7d21" },
  { id: 8, title: "Continual Learning Without Catastrophic Forgetting in Vision Transformers", authors: "D. Osei, R. Gupta", submitted: "2025-08-22", stage: "Rejected", reviewers: ["R-8830", "R-3342"], deadline: "2025-10-22", criteriaPublished: true, criteriaMet: false, hash: "0x56ef...a912" },
];

const stages = ["All", "New", "Criteria Published", "Reviewers Assigned", "Under Review", "Decision Pending", "Published", "Rejected"];

const stageColors = {
  "New": { bg: "rgba(150,150,170,0.15)", text: "#9a9aad", border: "rgba(150,150,170,0.3)" },
  "Criteria Published": { bg: "rgba(130,160,200,0.15)", text: "#7a9fc7", border: "rgba(130,160,200,0.3)" },
  "Reviewers Assigned": { bg: "rgba(160,140,200,0.15)", text: "#a98fc7", border: "rgba(160,140,200,0.3)" },
  "Under Review": { bg: "rgba(180,180,120,0.15)", text: "#c9b458", border: "rgba(180,180,120,0.3)" },
  "Decision Pending": { bg: "rgba(200,160,100,0.15)", text: "#c4956a", border: "rgba(200,160,100,0.3)" },
  "Published": { bg: "rgba(120,180,120,0.15)", text: "#8fbc8f", border: "rgba(120,180,120,0.3)" },
  "Rejected": { bg: "rgba(200,100,90,0.15)", text: "#d4645a", border: "rgba(200,100,90,0.3)" },
};

const reviewerPool = [
  { id: "R-1156", name: "Dr. S. Patel", field: "Machine Learning", score: 4.6, orcid: "0000-0002-1234-5678", reviews: 34 },
  { id: "R-3342", name: "Dr. L. Fernandez", field: "Computational Biology", score: 4.3, orcid: "0000-0003-8765-4321", reviews: 22 },
  { id: "R-4821", name: "Dr. K. Tanaka", field: "Statistical Learning", score: 4.4, orcid: "0000-0001-5678-9012", reviews: 41 },
  { id: "R-5567", name: "Dr. A. Novak", field: "NLP", score: 4.1, orcid: "0000-0002-9012-3456", reviews: 18 },
  { id: "R-7293", name: "Dr. M. Okonkwo", field: "Computer Vision", score: 4.7, orcid: "0000-0003-3456-7890", reviews: 29 },
  { id: "R-8830", name: "Dr. J. Moreau", field: "Optimization", score: 3.9, orcid: "0000-0001-7890-1234", reviews: 15 },
];

const sampleCriteria = [
  { label: "Methodology is reproducible", type: "Yes / No / Partially" },
  { label: "Statistical analysis is appropriate", type: "Yes / No / Partially" },
  { label: "Dataset is accessible and described", type: "Yes / No / Partially" },
  { label: "Claims are supported by evidence", type: "Yes / No / Partially" },
  { label: "Related work is adequately cited", type: "Yes / No / Partially" },
];

const NavItem = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    background: "none", border: "none", color: active ? "#c9b89e" : "#7a7a7a",
    fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 13, cursor: "pointer",
    padding: "8px 16px", letterSpacing: 1, textTransform: "uppercase",
    borderBottom: active ? "1px solid #c9b89e" : "1px solid transparent",
    transition: "all 0.3s ease",
  }}>{label}</button>
);

const StatCard = ({ label, value, sub, alert }) => (
  <div style={{
    background: "linear-gradient(145deg, rgba(45,42,38,0.9), rgba(35,32,28,0.9))",
    border: "1px solid rgba(120,110,95,0.25)", borderRadius: 6, padding: "20px 24px",
    flex: 1, minWidth: 150,
  }}>
    <div style={{ fontSize: 32, fontFamily: "'Georgia', serif", color: alert ? "#d4645a" : "#e8e0d4", fontWeight: 400, letterSpacing: -1 }}>{value}</div>
    <div style={{ fontSize: 11, color: "#8a8070", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: "#4a4238", marginTop: 4 }}>{sub}</div>}
  </div>
);

const StageBadge = ({ stage }) => {
  const c = stageColors[stage] || stageColors["New"];
  return (
    <span style={{
      background: c.bg, color: c.text, border: "1px solid " + c.border,
      padding: "3px 10px", borderRadius: 3, fontSize: 11, letterSpacing: 0.5,
      fontFamily: "'Georgia', serif", whiteSpace: "nowrap",
    }}>{stage}</span>
  );
};

export default function JournalDashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [filter, setFilter] = useState("All");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [detailTab, setDetailTab] = useState("info");
  const [searchReviewer, setSearchReviewer] = useState("");
  const [viewMode, setViewMode] = useState("table");

  const filtered = filter === "All" ? submissions : submissions.filter(s => s.stage === filter);
  const selected = submissions.find(s => s.id === selectedSubmission);

  const avgReviewDays = 38;
  const acceptRate = 62;
  const journalScore = 4.3;

  const pipelineCounts = {};
  stages.slice(1).forEach(st => { pipelineCounts[st] = submissions.filter(s => s.stage === st).length; });

  const filteredReviewers = reviewerPool.filter(r =>
    r.name.toLowerCase().includes(searchReviewer.toLowerCase()) ||
    r.field.toLowerCase().includes(searchReviewer.toLowerCase())
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#1a1816",
      backgroundImage: "radial-gradient(ellipse at 20% 0%, rgba(60,55,45,0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(50,45,35,0.2) 0%, transparent 50%)",
      color: "#d4ccc0", fontFamily: "'Georgia', 'Times New Roman', serif",
    }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 56, borderBottom: "1px solid rgba(120,110,95,0.2)",
        background: "rgba(25,23,20,0.9)", backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <span style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontStyle: "italic", color: "#c9b89e", letterSpacing: 2 }}>Axiom</span>
          <div style={{ display: "flex", gap: 0 }}>
            {["Dashboard", "Submissions", "Criteria", "Settings"].map(n => (
              <NavItem key={n} label={n} active={activeNav === n} onClick={() => setActiveNav(n)} />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative", cursor: "pointer" }}>
            <span style={{ fontSize: 18, color: "#8a8070" }}>{"\uD83D\uDD14"}</span>
            <span style={{ position: "absolute", top: -4, right: -6, background: "#c4956a", color: "#1a1816", fontSize: 9, fontFamily: "sans-serif", fontWeight: 700, borderRadius: 10, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>2</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 14px", background: "rgba(120,110,95,0.1)", border: "1px solid rgba(120,110,95,0.2)", borderRadius: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #3a3530, #5a5345)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#c9b89e" }}>JC</div>
            <div>
              <div style={{ fontSize: 12, color: "#c9b89e" }}>Journal of Computational Research</div>
              <div style={{ fontSize: 10, color: "#6a6050" }}>0x91c2...d4e7 - Editor</div>
            </div>
            <span style={{ fontSize: 10, color: "#6a6050", marginLeft: 4 }}>{"\u25BC"}</span>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 40px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 400, fontStyle: "italic", color: "#e8e0d4", margin: 0 }}>Journal Dashboard</h1>
          <p style={{ fontSize: 13, color: "#6a6050", marginTop: 6, fontStyle: "italic" }}>Manage submissions, review criteria, and publication decisions</p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <StatCard label="Total Submissions" value={submissions.length} />
          <StatCard label="Active Reviews" value={submissions.filter(s => ["Under Review", "Reviewers Assigned"].includes(s.stage)).length} />
          <StatCard label="Avg Review Time" value={avgReviewDays + "d"} sub="Target: 45 days" />
          <StatCard label="Acceptance Rate" value={acceptRate + "%"} />
          <StatCard label="Journal Reputation" value={journalScore.toFixed(1)} sub="/ 5.0" />
        </div>

        {/* Pipeline Summary */}
        <div style={{
          display: "flex", gap: 2, marginBottom: 32, padding: "16px 20px",
          background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.15)", borderRadius: 6,
        }}>
          {stages.slice(1).map((st, i) => {
            const c = stageColors[st];
            const count = pipelineCounts[st];
            return (
              <div key={st} onClick={() => setFilter(st === filter ? "All" : st)} style={{
                flex: 1, textAlign: "center", padding: "10px 4px", cursor: "pointer",
                borderRadius: 4, background: filter === st ? "rgba(120,110,95,0.15)" : "transparent",
                transition: "background 0.2s",
              }}>
                <div style={{ fontSize: 20, fontFamily: "'Georgia', serif", color: c.text }}>{count}</div>
                <div style={{ fontSize: 9, color: "#6a6050", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4, lineHeight: 1.3 }}>{st}</div>
                {i < stages.length - 2 && (
                  <div style={{ position: "absolute", right: 0, top: "50%", color: "#3a3530" }}></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {stages.map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{
                background: filter === s ? "rgba(180,160,120,0.15)" : "transparent",
                border: "1px solid " + (filter === s ? "rgba(180,160,120,0.3)" : "rgba(120,110,95,0.15)"),
                color: filter === s ? "#c9b89e" : "#6a6050", borderRadius: 3,
                padding: "5px 12px", fontSize: 11, fontFamily: "'Georgia', serif",
                cursor: "pointer", transition: "all 0.3s",
              }}>{s}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {["table", "kanban"].map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                background: viewMode === m ? "rgba(120,110,95,0.2)" : "transparent",
                border: "1px solid rgba(120,110,95,0.15)", color: viewMode === m ? "#c9b89e" : "#6a6050",
                borderRadius: 3, padding: "5px 10px", fontSize: 11, cursor: "pointer",
                fontFamily: "'Georgia', serif", textTransform: "capitalize",
              }}>{m}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {/* Main Table / Kanban */}
          <div style={{ flex: selectedSubmission ? 1.2 : 1, minWidth: 0 }}>
            {viewMode === "table" ? (
              <div style={{ border: "1px solid rgba(120,110,95,0.15)", borderRadius: 6, overflow: "hidden" }}>
                <div style={{
                  display: "grid", gridTemplateColumns: "2.2fr 1fr 0.7fr 0.8fr 0.6fr",
                  padding: "12px 16px", background: "rgba(45,42,38,0.5)",
                  borderBottom: "1px solid rgba(120,110,95,0.15)",
                  fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1.5,
                }}>
                  <span>Paper</span><span>Authors</span><span>Submitted</span><span>Stage</span><span>Reviewers</span>
                </div>
                {filtered.map((s, i) => (
                  <div key={s.id}
                    onClick={() => { setSelectedSubmission(s.id === selectedSubmission ? null : s.id); setDetailTab("info"); }}
                    onMouseEnter={() => setHoveredRow(s.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      display: "grid", gridTemplateColumns: "2.2fr 1fr 0.7fr 0.8fr 0.6fr",
                      padding: "13px 16px", alignItems: "center",
                      background: selectedSubmission === s.id ? "rgba(180,160,120,0.06)" : hoveredRow === s.id ? "rgba(120,110,95,0.06)" : "transparent",
                      borderBottom: i < filtered.length - 1 ? "1px solid rgba(120,110,95,0.06)" : "none",
                      borderLeft: selectedSubmission === s.id ? "3px solid #c9b89e" : "3px solid transparent",
                      cursor: "pointer", transition: "all 0.2s",
                    }}>
                    <span style={{ fontSize: 12, color: "#d4ccc0", lineHeight: 1.4, paddingRight: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                    <span style={{ fontSize: 11, color: "#8a8070", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.authors}</span>
                    <span style={{ fontSize: 11, color: "#6a6050" }}>{s.submitted}</span>
                    <span><StageBadge stage={s.stage} /></span>
                    <span style={{ fontSize: 11, color: "#6a6050" }}>{s.reviewers.length > 0 ? s.reviewers.length + " assigned" : "\u2014"}</span>
                  </div>
                ))}
              </div>
            ) : (
              /* Kanban View */
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
                {stages.slice(1).map(st => {
                  const c = stageColors[st];
                  const items = submissions.filter(s => s.stage === st);
                  return (
                    <div key={st} style={{
                      minWidth: 180, flex: 1, background: "rgba(45,42,38,0.3)",
                      border: "1px solid rgba(120,110,95,0.1)", borderRadius: 6, padding: 10,
                    }}>
                      <div style={{ fontSize: 10, color: c.text, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                        <span>{st}</span>
                        <span style={{ background: c.bg, padding: "1px 6px", borderRadius: 8, fontSize: 10 }}>{items.length}</span>
                      </div>
                      {items.map(s => (
                        <div key={s.id}
                          onClick={() => { setSelectedSubmission(s.id === selectedSubmission ? null : s.id); setDetailTab("info"); }}
                          style={{
                            padding: "10px 12px", marginBottom: 6, borderRadius: 4,
                            background: selectedSubmission === s.id ? "rgba(180,160,120,0.1)" : "rgba(30,28,24,0.6)",
                            border: "1px solid " + (selectedSubmission === s.id ? "rgba(180,160,120,0.3)" : "rgba(120,110,95,0.1)"),
                            cursor: "pointer", transition: "all 0.2s",
                          }}>
                          <div style={{ fontSize: 11, color: "#d4ccc0", lineHeight: 1.4, marginBottom: 4 }}>{s.title}</div>
                          <div style={{ fontSize: 10, color: "#6a6050" }}>{s.authors.split(",")[0]}{s.authors.includes(",") ? " et al." : ""}</div>
                        </div>
                      ))}
                      {items.length === 0 && <div style={{ fontSize: 10, color: "#3a3530", fontStyle: "italic", padding: 8 }}>No submissions</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div style={{
              flex: 1, background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.2)",
              borderRadius: 8, padding: 0, maxHeight: "calc(100vh - 240px)", overflowY: "auto",
              position: "sticky", top: 80,
            }}>
              {/* Detail Header */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(120,110,95,0.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, color: "#e8e0d4", lineHeight: 1.4, marginBottom: 8 }}>{selected.title}</div>
                    <StageBadge stage={selected.stage} />
                  </div>
                  <button onClick={() => setSelectedSubmission(null)} style={{
                    background: "none", border: "none", color: "#6a6050", fontSize: 18, cursor: "pointer", padding: 0, lineHeight: 1,
                  }}>{"\u2715"}</button>
                </div>
              </div>

              {/* Detail Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid rgba(120,110,95,0.1)" }}>
                {["info", "criteria", "reviewers", "decision"].map(t => (
                  <button key={t} onClick={() => setDetailTab(t)} style={{
                    background: "none", border: "none", flex: 1, padding: "10px 8px",
                    borderBottom: detailTab === t ? "2px solid #c9b89e" : "2px solid transparent",
                    color: detailTab === t ? "#c9b89e" : "#6a6050", fontSize: 11, cursor: "pointer",
                    fontFamily: "'Georgia', serif", textTransform: "capitalize", letterSpacing: 0.5,
                  }}>{t}</button>
                ))}
              </div>

              <div style={{ padding: "20px 24px" }}>
                {/* Info Tab */}
                {detailTab === "info" && (
                  <div>
                    {[
                      { label: "Authors", value: selected.authors },
                      { label: "Submitted", value: selected.submitted },
                      { label: "Deadline", value: selected.deadline || "Not set" },
                      { label: "Paper Hash", value: selected.hash, mono: true },
                    ].map((f, i) => (
                      <div key={i} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{f.label}</div>
                        <div style={{ fontSize: 13, color: f.mono ? "#5a7a9a" : "#d4ccc0", fontFamily: f.mono ? "monospace" : "inherit" }}>{f.value}</div>
                      </div>
                    ))}
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Contract</div>
                      <div style={{ fontSize: 11, color: "#5a7a9a", fontFamily: "monospace", cursor: "pointer" }}>View authorship contract on Hedera {"\u2197"}</div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Provenance</div>
                      {["Dataset", "Code Commit", "Environment"].map((p, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11 }}>
                          <span style={{ color: "#8a8070" }}>{p}</span>
                          <span style={{ color: "#5a7a9a", fontFamily: "monospace", fontSize: 10 }}>0x{Math.random().toString(16).slice(2, 6)}...{Math.random().toString(16).slice(2, 6)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Criteria Tab */}
                {detailTab === "criteria" && (
                  <div>
                    {selected.criteriaPublished ? (
                      <div>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
                          padding: "8px 12px", background: "rgba(120,180,120,0.08)",
                          border: "1px solid rgba(120,180,120,0.2)", borderRadius: 4,
                        }}>
                          <span style={{ color: "#8fbc8f", fontSize: 14 }}>{"\u2713"}</span>
                          <span style={{ fontSize: 11, color: "#8fbc8f" }}>Criteria published on-chain and immutable</span>
                        </div>
                        {sampleCriteria.map((c, i) => (
                          <div key={i} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "10px 0", borderBottom: i < sampleCriteria.length - 1 ? "1px solid rgba(120,110,95,0.08)" : "none",
                          }}>
                            <span style={{ fontSize: 12, color: "#d4ccc0" }}>{c.label}</span>
                            <span style={{ fontSize: 10, color: "#6a6050", background: "rgba(120,110,95,0.1)", padding: "2px 8px", borderRadius: 3 }}>{c.type}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: 12, fontSize: 10, color: "#5a7a9a", fontFamily: "monospace" }}>Criteria hash: 0x7c91...e3f2 {"\u2197"}</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{
                          padding: "8px 12px", marginBottom: 16,
                          background: "rgba(200,160,100,0.08)", border: "1px solid rgba(200,160,100,0.2)", borderRadius: 4,
                        }}>
                          <span style={{ fontSize: 11, color: "#c4956a" }}>Criteria must be published on-chain before reviewers can be assigned</span>
                        </div>
                        {sampleCriteria.map((c, i) => (
                          <div key={i} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "10px 12px", marginBottom: 4, background: "rgba(30,28,24,0.4)",
                            border: "1px solid rgba(120,110,95,0.08)", borderRadius: 4,
                          }}>
                            <span style={{ fontSize: 12, color: "#b0a898" }}>{c.label}</span>
                            <span style={{ fontSize: 10, color: "#6a6050" }}>{c.type}</span>
                          </div>
                        ))}
                        <button style={{
                          marginTop: 16, width: "100%", padding: "10px 0",
                          background: "linear-gradient(135deg, rgba(180,160,120,0.25), rgba(160,140,100,0.15))",
                          border: "1px solid rgba(180,160,120,0.4)", borderRadius: 4,
                          color: "#d4c8a8", fontFamily: "'Georgia', serif", fontSize: 13,
                          cursor: "pointer", letterSpacing: 0.5,
                        }}>Publish Criteria On-Chain</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviewers Tab */}
                {detailTab === "reviewers" && (
                  <div>
                    {!selected.criteriaPublished ? (
                      <div style={{
                        padding: "16px", textAlign: "center", color: "#6a6050", fontStyle: "italic", fontSize: 12,
                      }}>
                        Publish review criteria first to assign reviewers
                      </div>
                    ) : (
                      <div>
                        {selected.reviewers.length > 0 && (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Assigned</div>
                            {selected.reviewers.map((rid, i) => {
                              const r = reviewerPool.find(x => x.id === rid);
                              return r ? (
                                <div key={i} style={{
                                  display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", marginBottom: 4,
                                  background: "rgba(120,180,120,0.05)", border: "1px solid rgba(120,180,120,0.1)", borderRadius: 4,
                                }}>
                                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(120,110,95,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#8a8070" }}>{r.name.split(" ").pop()[0]}</div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, color: "#d4ccc0" }}>{r.name}</div>
                                    <div style={{ fontSize: 10, color: "#6a6050" }}>{r.field} - Score: {r.score}</div>
                                  </div>
                                  <span style={{ fontSize: 10, color: "#8fbc8f" }}>Assigned</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                        <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Find Reviewers</div>
                        <input
                          type="text" placeholder="Search by name or field..."
                          value={searchReviewer} onChange={e => setSearchReviewer(e.target.value)}
                          style={{
                            width: "100%", padding: "8px 12px", background: "rgba(30,28,24,0.6)",
                            border: "1px solid rgba(120,110,95,0.2)", borderRadius: 4,
                            color: "#d4ccc0", fontFamily: "'Georgia', serif", fontSize: 12,
                            outline: "none", boxSizing: "border-box", marginBottom: 10,
                          }}
                        />
                        {filteredReviewers.filter(r => !selected.reviewers.includes(r.id)).map((r, i) => (
                          <div key={i} style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", marginBottom: 4,
                            background: "rgba(30,28,24,0.4)", border: "1px solid rgba(120,110,95,0.08)", borderRadius: 4,
                          }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(120,110,95,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#6a6050" }}>{r.name.split(" ").pop()[0]}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, color: "#b0a898" }}>{r.name}</div>
                              <div style={{ fontSize: 10, color: "#6a6050" }}>{r.field} - {r.reviews} reviews - Score: {r.score}</div>
                            </div>
                            <button style={{
                              background: "none", border: "1px solid rgba(120,110,95,0.25)",
                              color: "#8a8070", padding: "3px 10px", borderRadius: 3,
                              fontSize: 10, cursor: "pointer", fontFamily: "'Georgia', serif",
                            }}>Assign</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Decision Tab */}
                {detailTab === "decision" && (
                  <div>
                    {selected.stage === "Published" && (
                      <div style={{
                        padding: "16px", background: "rgba(120,180,120,0.08)",
                        border: "1px solid rgba(120,180,120,0.2)", borderRadius: 6, textAlign: "center",
                      }}>
                        <div style={{ fontSize: 14, color: "#8fbc8f", marginBottom: 4 }}>{"\u2713"} Published</div>
                        <div style={{ fontSize: 11, color: "#6a6050" }}>This paper has been accepted and published on-chain</div>
                      </div>
                    )}
                    {selected.stage === "Rejected" && (
                      <div style={{
                        padding: "16px", background: "rgba(200,100,90,0.08)",
                        border: "1px solid rgba(200,100,90,0.2)", borderRadius: 6,
                      }}>
                        <div style={{ fontSize: 14, color: "#d4645a", marginBottom: 4 }}>{"\u2715"} Rejected</div>
                        <div style={{ fontSize: 11, color: "#6a6050" }}>On-chain justification recorded</div>
                      </div>
                    )}
                    {selected.stage === "Decision Pending" && selected.criteriaMet && (
                      <div>
                        <div style={{
                          padding: "12px 16px", marginBottom: 16,
                          background: "rgba(180,160,120,0.1)", border: "1px solid rgba(180,160,120,0.3)", borderRadius: 6,
                        }}>
                          <div style={{ fontSize: 12, color: "#d4c8a8", fontWeight: 600, marginBottom: 4 }}>All criteria met</div>
                          <div style={{ fontSize: 11, color: "#8a8070" }}>Journal is contractually bound to publish this paper per the pre-registered review criteria.</div>
                        </div>
                        <button style={{
                          width: "100%", padding: "12px 0", marginBottom: 8,
                          background: "linear-gradient(135deg, rgba(120,180,120,0.25), rgba(100,160,100,0.15))",
                          border: "1px solid rgba(120,180,120,0.4)", borderRadius: 4,
                          color: "#8fbc8f", fontFamily: "'Georgia', serif", fontSize: 13, cursor: "pointer",
                        }}>Publish Paper</button>
                        <div style={{ textAlign: "center", padding: "8px 0" }}>
                          <span style={{ fontSize: 10, color: "#6a6050" }}>or</span>
                        </div>
                        <button style={{
                          width: "100%", padding: "10px 0",
                          background: "transparent", border: "1px solid rgba(200,100,90,0.3)", borderRadius: 4,
                          color: "#d4645a", fontFamily: "'Georgia', serif", fontSize: 12, cursor: "pointer",
                        }}>Reject with Public Justification</button>
                        <div style={{ fontSize: 10, color: "#d4645a", marginTop: 6, fontStyle: "italic", textAlign: "center" }}>
                          Warning: Rejecting after criteria are met requires detailed public justification and impacts journal reputation
                        </div>
                      </div>
                    )}
                    {!["Published", "Rejected", "Decision Pending"].includes(selected.stage) && (
                      <div style={{ padding: 16, textAlign: "center", color: "#6a6050", fontStyle: "italic", fontSize: 12 }}>
                        Decision available after all reviews are submitted
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: 60, padding: "24px 40px", borderTop: "1px solid rgba(120,110,95,0.15)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 11, color: "#4a4238", fontStyle: "italic" }}>Axiom - Research Integrity, Restored</span>
        <span style={{ fontSize: 10, color: "#3a3530" }}>Hedera Mainnet - Block 82,451,203</span>
      </footer>
    </div>
  );
}