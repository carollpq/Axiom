"use client";

import { useState } from "react";

const existingDrafts = [
  { id: 1, title: "Adversarial Robustness in Federated Learning Protocols", hash: "0x1e4c...a3b7" },
  { id: 2, title: "Quantum Error Correction in Noisy Intermediate-Scale Devices", hash: "0xb8e2...7f04" },
];

const knownUsers = [
  { did: "did:hedera:0x7f3a9c2d", name: "Dr. A. Reeves", orcid: "0000-0001-2345-6789", wallet: "0x7f3a...9c2d" },
  { did: "did:hedera:0x4e1ba7f3", name: "Dr. K. Tanaka", orcid: "0000-0002-8765-4321", wallet: "0x4e1b...a7f3" },
  { did: "did:hedera:0x91c2d4e7", name: "Dr. J. Kim", orcid: "0000-0003-1234-5678", wallet: "0x91c2...d4e7" },
  { did: "did:hedera:0x3b8f2a1c", name: "Dr. S. Huang", orcid: "0000-0001-9876-5432", wallet: "0x3b8f...2a1c" },
];

export default function ContractBuilder() {
  const [selectedDraft, setSelectedDraft] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [contributors, setContributors] = useState([
    { id: 1, wallet: "0x7f3a...9c2d", did: "did:hedera:0x7f3a9c2d", name: "Dr. A. Reeves", orcid: "0000-0001-2345-6789", pct: 40, role: "Lead author, experimental design", status: "signed", txHash: "0xfa91...2c3d", signedAt: "2026-02-06 14:32 UTC", isCreator: true },
    { id: 2, wallet: "0x91c2...d4e7", did: "did:hedera:0x91c2d4e7", name: "Dr. J. Kim", orcid: "0000-0003-1234-5678", pct: 30, role: "Statistical analysis", status: "pending", txHash: null, signedAt: null, isCreator: false },
    { id: 3, wallet: "0x3b8f...2a1c", did: "did:hedera:0x3b8f2a1c", name: "Dr. S. Huang", orcid: "0000-0001-9876-5432", pct: 30, role: "Data collection", status: "pending", txHash: null, signedAt: null, isCreator: false },
  ]);
  const [showAddRow, setShowAddRow] = useState(false);
  const [addWallet, setAddWallet] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  const totalPct = contributors.reduce((s, c) => s + (Number(c.pct) || 0), 0);
  const isValid = totalPct === 100;
  const signedCount = contributors.filter(c => c.status === "signed").length;
  const allSigned = signedCount === contributors.length;
  const hasSigned = contributors.some(c => c.status === "signed");
  const currentUserWallet = "0x7f3a...9c2d";

  const updateContributor = (id: number, field: string, value: string | number) => {
    setContributors(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: field === "pct" ? (value === "" ? "" : Number(value)) : value };
      if (hasSigned && c.status === "signed" && c.id !== id) {
        return { ...c, status: "pending", txHash: null, signedAt: null };
      }
      return updated;
    }));
  };

  const removeContributor = (id: number) => {
    setContributors(prev => prev.filter(c => c.id !== id));
  };

  const addContributor = () => {
    const found = knownUsers.find(u => u.wallet === addWallet || u.did === addWallet);
    const newId = Math.max(...contributors.map(c => c.id)) + 1;
    if (found) {
      setContributors(prev => [...prev, {
        id: newId, wallet: found.wallet, did: found.did, name: found.name,
        orcid: found.orcid, pct: 0, role: "", status: "pending", txHash: null, signedAt: null, isCreator: false,
      }]);
    } else if (addWallet.trim()) {
      setContributors(prev => [...prev, {
        id: newId, wallet: addWallet, did: addWallet, name: "Unknown user",
        orcid: "\u2014", pct: 0, role: "", status: "pending", txHash: null, signedAt: null, isCreator: false,
      }]);
    }
    setAddWallet("");
    setShowAddRow(false);
  };

  const handleSign = (id: number) => {
    setContributors(prev => prev.map(c =>
      c.id === id ? { ...c, status: "signed", txHash: "0x" + Math.random().toString(16).slice(2, 6) + "..." + Math.random().toString(16).slice(2, 6), signedAt: "2026-02-08 10:15 UTC" } : c
    ));
  };

  const handleInvite = () => {
    setInviteLink("https://axiom.pub/invite/c7f2a9e1-3b4d-4e5f");
    setShowInviteModal(true);
  };

  const draft = existingDrafts.find(d => d.id === selectedDraft);

  return (
    <>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 40px" }}>
        {/* Header */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "#6a6050", marginBottom: 8 }}>
            <span style={{ cursor: "pointer" }}>Dashboard</span>
            <span style={{ margin: "0 8px" }}>/</span>
            <span style={{ color: "#8a8070" }}>Authorship Contract Builder</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 400, fontStyle: "italic", color: "#e8e0d4", margin: 0 }}>Authorship Contract Builder</h1>
          <p style={{ fontSize: 13, color: "#6a6050", marginTop: 6, fontStyle: "italic" }}>Define contributions, collect signatures, record on Hedera</p>
        </div>

        {/* Paper Selection */}
        <div style={{
          background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.2)",
          borderRadius: 8, padding: 24, marginTop: 28, marginBottom: 24,
        }}>
          <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Paper Selection</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 250 }}>
              <div style={{ fontSize: 11, color: "#8a8070", marginBottom: 6 }}>Select existing draft</div>
              <select
                value={selectedDraft || ""}
                onChange={e => { setSelectedDraft(e.target.value ? Number(e.target.value) : null); setNewTitle(""); }}
                style={{
                  width: "100%", padding: "10px 12px", background: "rgba(30,28,24,0.8)",
                  border: "1px solid rgba(120,110,95,0.25)", borderRadius: 4,
                  color: "#d4ccc0", fontFamily: "'Georgia', serif", fontSize: 13, outline: "none",
                  appearance: "none", cursor: "pointer",
                }}
              >
                <option value="">-- Choose a draft --</option>
                {existingDrafts.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", padding: "0 8px" }}>
              <span style={{ fontSize: 12, color: "#4a4238", fontStyle: "italic" }}>or</span>
            </div>
            <div style={{ flex: 1, minWidth: 250 }}>
              <div style={{ fontSize: 11, color: "#8a8070", marginBottom: 6 }}>Enter new paper title</div>
              <input
                type="text" placeholder="New paper title..."
                value={newTitle}
                onChange={e => { setNewTitle(e.target.value); setSelectedDraft(null); }}
                style={{
                  width: "100%", padding: "10px 12px", background: "rgba(30,28,24,0.8)",
                  border: "1px solid rgba(120,110,95,0.25)", borderRadius: 4,
                  color: "#d4ccc0", fontFamily: "'Georgia', serif", fontSize: 13, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          {draft && (
            <div style={{ marginTop: 12, fontSize: 11, color: "#5a7a9a", fontFamily: "monospace" }}>
              Draft hash: {draft.hash} {"\u2197"}
            </div>
          )}
        </div>

        {/* Contributor List */}
        <div style={{
          background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.2)",
          borderRadius: 8, padding: 24, marginBottom: 24,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1.5 }}>Contributors</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 120, height: 6, background: "rgba(120,110,95,0.2)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    width: Math.min(totalPct, 100) + "%", height: "100%", borderRadius: 3,
                    background: isValid ? "linear-gradient(90deg, #8fbc8f, #a0d0a0)" : totalPct > 100 ? "#d4645a" : "linear-gradient(90deg, #c9b458, #d4c868)",
                    transition: "all 0.3s",
                  }} />
                </div>
                <span style={{
                  fontSize: 13, fontFamily: "sans-serif", fontWeight: 600,
                  color: isValid ? "#8fbc8f" : totalPct > 100 ? "#d4645a" : "#c9b458",
                }}>{totalPct}%</span>
                {isValid && <span style={{ color: "#8fbc8f", fontSize: 14 }}>{"\u2713"}</span>}
              </div>
            </div>
          </div>

          {!isValid && (
            <div style={{
              padding: "8px 14px", marginBottom: 16, borderRadius: 4,
              background: totalPct > 100 ? "rgba(200,100,90,0.08)" : "rgba(200,160,100,0.08)",
              border: "1px solid " + (totalPct > 100 ? "rgba(200,100,90,0.2)" : "rgba(200,160,100,0.2)"),
              fontSize: 11, color: totalPct > 100 ? "#d4645a" : "#c4956a",
            }}>
              {totalPct > 100 ? "Total exceeds 100%. Please adjust contribution percentages." : "Contributions must sum to exactly 100% before signatures can be collected."}
            </div>
          )}

          {/* Table Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1.8fr 0.8fr 0.5fr 1.2fr 0.8fr 0.3fr",
            padding: "10px 14px", background: "rgba(30,28,24,0.4)", borderRadius: "6px 6px 0 0",
            border: "1px solid rgba(120,110,95,0.1)", borderBottom: "none",
            fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1.2, gap: 8,
          }}>
            <span>Contributor</span><span>ORCID</span><span>%</span><span>Role</span><span>Signature</span><span></span>
          </div>

          {/* Contributor Rows */}
          {contributors.map((c, i) => (
            <div key={c.id} style={{
              display: "grid", gridTemplateColumns: "1.8fr 0.8fr 0.5fr 1.2fr 0.8fr 0.3fr",
              padding: "12px 14px", alignItems: "center", gap: 8,
              background: c.status === "signed" ? "rgba(120,180,120,0.03)" : "transparent",
              border: "1px solid rgba(120,110,95,0.08)", borderTop: "none",
              borderRadius: i === contributors.length - 1 && !showAddRow ? "0 0 6px 6px" : 0,
            }}>
              <div>
                <div style={{ fontSize: 13, color: "#d4ccc0", display: "flex", alignItems: "center", gap: 6 }}>
                  {c.name}
                  {c.isCreator && <span style={{ fontSize: 9, color: "#c9b89e", background: "rgba(180,160,120,0.15)", padding: "1px 6px", borderRadius: 3 }}>Creator</span>}
                </div>
                <div style={{ fontSize: 10, color: "#5a7a9a", fontFamily: "monospace", marginTop: 2 }}>{c.wallet}</div>
              </div>
              <div style={{ fontSize: 11, color: c.orcid === "\u2014" ? "#4a4238" : "#8a8070" }}>{c.orcid}</div>
              <input
                type="number" min="0" max="100" value={c.pct}
                onChange={e => updateContributor(c.id, "pct", e.target.value)}
                style={{
                  width: "100%", padding: "6px 8px", background: "rgba(30,28,24,0.6)",
                  border: "1px solid rgba(120,110,95,0.2)", borderRadius: 3,
                  color: "#d4ccc0", fontFamily: "sans-serif", fontSize: 13, outline: "none",
                  textAlign: "center", boxSizing: "border-box",
                }}
              />
              <input
                type="text" placeholder="Describe role..." value={c.role}
                onChange={e => updateContributor(c.id, "role", e.target.value)}
                style={{
                  width: "100%", padding: "6px 8px", background: "rgba(30,28,24,0.6)",
                  border: "1px solid rgba(120,110,95,0.2)", borderRadius: 3,
                  color: "#b0a898", fontFamily: "'Georgia', serif", fontSize: 11, outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div>
                {c.status === "signed" ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: "#8fbc8f", fontSize: 13 }}>{"\u2713"}</span>
                      <span style={{ fontSize: 11, color: "#8fbc8f" }}>Signed</span>
                    </div>
                    <div style={{ fontSize: 9, color: "#5a7a9a", fontFamily: "monospace", marginTop: 2 }}>{c.txHash}</div>
                  </div>
                ) : c.status === "declined" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: "#d4645a", fontSize: 13 }}>{"\u2715"}</span>
                    <span style={{ fontSize: 11, color: "#d4645a" }}>Declined</span>
                  </div>
                ) : (
                  <div>
                    {c.wallet === currentUserWallet ? (
                      <button onClick={() => handleSign(c.id)} disabled={!isValid} style={{
                        background: isValid ? "linear-gradient(135deg, rgba(180,160,120,0.25), rgba(160,140,100,0.15))" : "rgba(120,110,95,0.1)",
                        border: "1px solid " + (isValid ? "rgba(180,160,120,0.4)" : "rgba(120,110,95,0.15)"),
                        color: isValid ? "#d4c8a8" : "#4a4238", borderRadius: 3, padding: "5px 12px",
                        fontSize: 11, cursor: isValid ? "pointer" : "not-allowed",
                        fontFamily: "'Georgia', serif",
                      }}>Sign</button>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "#c4956a" }}>Pending</span>
                        <button style={{
                          background: "none", border: "1px solid rgba(120,110,95,0.2)",
                          color: "#6a6050", borderRadius: 3, padding: "3px 8px",
                          fontSize: 9, cursor: "pointer", fontFamily: "'Georgia', serif",
                        }}>Remind</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                {!c.isCreator && !hasSigned && (
                  <button onClick={() => removeContributor(c.id)} style={{
                    background: "none", border: "none", color: "#4a4238", fontSize: 16,
                    cursor: "pointer", padding: 0, lineHeight: 1,
                  }}>{"\u2715"}</button>
                )}
              </div>
            </div>
          ))}

          {/* Add Contributor Row */}
          {showAddRow ? (
            <div style={{
              display: "flex", gap: 10, padding: "12px 14px", alignItems: "center",
              border: "1px solid rgba(120,110,95,0.08)", borderTop: "none",
              borderRadius: "0 0 6px 6px", background: "rgba(30,28,24,0.3)",
            }}>
              <input
                type="text" placeholder="Wallet address or DID..."
                value={addWallet} onChange={e => setAddWallet(e.target.value)}
                style={{
                  flex: 1, padding: "8px 12px", background: "rgba(30,28,24,0.6)",
                  border: "1px solid rgba(120,110,95,0.2)", borderRadius: 4,
                  color: "#d4ccc0", fontFamily: "monospace", fontSize: 12, outline: "none",
                }}
              />
              <button onClick={addContributor} style={{
                background: "linear-gradient(135deg, rgba(180,160,120,0.2), rgba(160,140,100,0.1))",
                border: "1px solid rgba(180,160,120,0.3)", borderRadius: 4, padding: "8px 16px",
                color: "#d4c8a8", fontFamily: "'Georgia', serif", fontSize: 12, cursor: "pointer",
              }}>Add</button>
              <button onClick={() => { setShowAddRow(false); setAddWallet(""); }} style={{
                background: "none", border: "1px solid rgba(120,110,95,0.15)", borderRadius: 4,
                padding: "8px 12px", color: "#6a6050", fontSize: 12, cursor: "pointer",
                fontFamily: "'Georgia', serif",
              }}>Cancel</button>
              <button onClick={handleInvite} style={{
                background: "none", border: "1px solid rgba(130,160,200,0.25)", borderRadius: 4,
                padding: "8px 12px", color: "#7a9fc7", fontSize: 11, cursor: "pointer",
                fontFamily: "'Georgia', serif",
              }}>Invite Off-Platform</button>
            </div>
          ) : (
            <button onClick={() => setShowAddRow(true)} style={{
              width: "100%", padding: "10px 0", marginTop: 10,
              background: "transparent", border: "1px dashed rgba(120,110,95,0.25)",
              borderRadius: 4, color: "#6a6050", fontFamily: "'Georgia', serif",
              fontSize: 12, cursor: "pointer", transition: "all 0.3s",
            }}>+ Add Contributor</button>
          )}
        </div>

        {/* Signature Progress */}
        <div style={{
          background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.2)",
          borderRadius: 8, padding: 24, marginBottom: 24,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1.5 }}>Signature Progress</div>
            <span style={{ fontSize: 13, color: allSigned ? "#8fbc8f" : "#c9b89e" }}>
              {signedCount} of {contributors.length} signed
            </span>
          </div>
          <div style={{ width: "100%", height: 8, background: "rgba(120,110,95,0.15)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              width: (signedCount / contributors.length * 100) + "%", height: "100%", borderRadius: 4,
              background: allSigned ? "linear-gradient(90deg, #8fbc8f, #a0d0a0)" : "linear-gradient(90deg, #c9b89e, #d4c8a8)",
              transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            {contributors.map(c => (
              <div key={c.id} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
                background: c.status === "signed" ? "rgba(120,180,120,0.08)" : "rgba(120,110,95,0.06)",
                border: "1px solid " + (c.status === "signed" ? "rgba(120,180,120,0.15)" : "rgba(120,110,95,0.1)"),
                borderRadius: 20, fontSize: 11,
              }}>
                <span style={{ color: c.status === "signed" ? "#8fbc8f" : c.status === "declined" ? "#d4645a" : "#6a6050" }}>
                  {c.status === "signed" ? "\u2713" : c.status === "declined" ? "\u2715" : "\u25CB"}
                </span>
                <span style={{ color: c.status === "signed" ? "#8fbc8f" : "#8a8070" }}>{c.name.split(" ").pop()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contract Preview */}
        <div style={{
          background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.2)",
          borderRadius: 8, overflow: "hidden", marginBottom: 24,
        }}>
          <button onClick={() => setShowPreview(!showPreview)} style={{
            width: "100%", padding: "16px 24px", background: "none", border: "none",
            display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
          }}>
            <span style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1.5 }}>Contract Preview</span>
            <span style={{ color: "#6a6050", fontSize: 12 }}>{showPreview ? "\u25B2" : "\u25BC"}</span>
          </button>
          {showPreview && (
            <div style={{ padding: "0 24px 24px" }}>
              <div style={{
                background: "rgba(30,28,24,0.6)", border: "1px solid rgba(120,110,95,0.1)",
                borderRadius: 6, padding: 20,
              }}>
                <div style={{ fontSize: 14, color: "#e8e0d4", fontStyle: "italic", marginBottom: 16 }}>
                  {draft ? draft.title : newTitle || "Untitled Paper"}
                </div>
                {draft && <div style={{ fontSize: 10, color: "#5a7a9a", fontFamily: "monospace", marginBottom: 16 }}>Paper hash: {draft.hash}</div>}

                <div style={{ fontSize: 10, color: "#6a6050", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Contributors</div>
                {contributors.map((c, i) => (
                  <div key={c.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0",
                    borderBottom: i < contributors.length - 1 ? "1px solid rgba(120,110,95,0.08)" : "none",
                  }}>
                    <div>
                      <span style={{ fontSize: 13, color: "#d4ccc0" }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: "#6a6050", marginLeft: 8 }}>{c.role}</span>
                    </div>
                    <span style={{ fontSize: 15, color: "#c9b89e", fontFamily: "sans-serif", fontWeight: 600 }}>{c.pct}%</span>
                  </div>
                ))}

                <div style={{
                  marginTop: 16, padding: "12px 14px", background: "rgba(120,110,95,0.06)",
                  borderRadius: 4, fontSize: 11, color: "#8a8070", lineHeight: 1.6, fontStyle: "italic",
                }}>
                  All parties agree to the contribution split as defined above. Any modification to authorship order or contribution weights requires unanimous re-signing by all contributors. This contract is immutably recorded on Hedera.
                </div>

                <div style={{ marginTop: 14, fontSize: 10, color: "#5a7a9a", fontFamily: "monospace" }}>
                  Contract hash: 0x{Math.random().toString(16).slice(2, 10)}...{Math.random().toString(16).slice(2, 6)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modification Warning */}
        {hasSigned && (
          <div style={{
            padding: "12px 16px", marginBottom: 24, borderRadius: 6,
            background: "rgba(200,160,100,0.08)", border: "1px solid rgba(200,160,100,0.2)",
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <span style={{ color: "#c4956a", fontSize: 16, flexShrink: 0, lineHeight: 1 }}>{"\u26A0"}</span>
            <div>
              <div style={{ fontSize: 12, color: "#c4956a", fontWeight: 600, marginBottom: 2 }}>Signatures collected</div>
              <div style={{ fontSize: 11, color: "#8a8070" }}>
                Modifying any field will invalidate all existing signatures. All contributors will need to re-sign. Previous versions are retained on-chain.
              </div>
            </div>
          </div>
        )}

        {/* Submission Gate */}
        <div style={{
          background: allSigned ? "rgba(120,180,120,0.06)" : "rgba(45,42,38,0.5)",
          border: "1px solid " + (allSigned ? "rgba(120,180,120,0.2)" : "rgba(120,110,95,0.2)"),
          borderRadius: 8, padding: 24, textAlign: "center",
        }}>
          {allSigned ? (
            <div>
              <div style={{ fontSize: 14, color: "#8fbc8f", marginBottom: 4 }}>{"\u2713"} Contract Fully Signed</div>
              <div style={{ fontSize: 11, color: "#6a6050", marginBottom: 16 }}>Recorded immutably on Hedera. You may now proceed to submission.</div>
              <button style={{
                padding: "12px 32px",
                background: "linear-gradient(135deg, rgba(120,180,120,0.25), rgba(100,160,100,0.15))",
                border: "1px solid rgba(120,180,120,0.4)", borderRadius: 4,
                color: "#8fbc8f", fontFamily: "'Georgia', serif", fontSize: 14, cursor: "pointer",
                letterSpacing: 0.5,
              }}>Proceed to Submission {"\u2192"}</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: "#6a6050", marginBottom: 8 }}>
                {isValid
                  ? `Waiting for ${contributors.length - signedCount} more signature${contributors.length - signedCount > 1 ? "s" : ""}`
                  : "Contributions must total 100% before signatures"
                }
              </div>
              <button disabled style={{
                padding: "12px 32px", background: "rgba(120,110,95,0.1)",
                border: "1px solid rgba(120,110,95,0.15)", borderRadius: 4,
                color: "#4a4238", fontFamily: "'Georgia', serif", fontSize: 14,
                cursor: "not-allowed", letterSpacing: 0.5,
              }}>Proceed to Submission {"\u2192"}</button>
              <div style={{ fontSize: 10, color: "#4a4238", marginTop: 8, fontStyle: "italic" }}>
                All co-authors must sign before submission
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 200,
        }} onClick={() => setShowInviteModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#2a2723", border: "1px solid rgba(120,110,95,0.3)",
            borderRadius: 8, padding: 28, maxWidth: 440, width: "90%",
          }}>
            <div style={{ fontSize: 16, color: "#e8e0d4", fontStyle: "italic", marginBottom: 12 }}>Invite Off-Platform Contributor</div>
            <div style={{ fontSize: 12, color: "#8a8070", marginBottom: 16, lineHeight: 1.6 }}>
              Share this link with your collaborator. They will be prompted to connect a wallet and sign the contract.
            </div>
            <div style={{
              display: "flex", gap: 8, padding: "10px 14px",
              background: "rgba(30,28,24,0.8)", border: "1px solid rgba(120,110,95,0.2)", borderRadius: 4,
            }}>
              <span style={{ flex: 1, fontSize: 12, color: "#5a7a9a", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis" }}>{inviteLink}</span>
              <button style={{
                background: "rgba(180,160,120,0.15)", border: "1px solid rgba(180,160,120,0.3)",
                borderRadius: 3, padding: "4px 12px", color: "#c9b89e", fontSize: 11, cursor: "pointer",
                fontFamily: "'Georgia', serif",
              }}>Copy</button>
            </div>
            <button onClick={() => setShowInviteModal(false)} style={{
              marginTop: 16, width: "100%", padding: "10px 0", background: "none",
              border: "1px solid rgba(120,110,95,0.2)", borderRadius: 4,
              color: "#6a6050", fontFamily: "'Georgia', serif", fontSize: 12, cursor: "pointer",
            }}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
