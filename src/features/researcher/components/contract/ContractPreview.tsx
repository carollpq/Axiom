"use client";

import { useState } from "react";
import { fetchApi } from "@/src/shared/lib/api";
import { ModalOverlay } from "@/src/shared/components/ModalOverlay";
import type { Contributor, ExistingDraft } from "@/src/features/researcher/types/contract";
import type { RegisteredJournal } from "@/src/features/researcher/types/paper-registration";

interface ContractPreviewProps {
  title: string;
  draft: ExistingDraft | undefined;
  contributors: Contributor[];
  allSigned: boolean;
  isValid: boolean;
  signedCount: number;
  paperId?: string;
  contractId?: string | null;
}

export function ContractPreview({
  title, draft, contributors,
  allSigned, isValid, signedCount, paperId, contractId,
}: ContractPreviewProps) {
  const remaining = contributors.length - signedCount;
  const [showModal, setShowModal] = useState(false);
  const [journals, setJournals] = useState<RegisteredJournal[]>([]);
  const [selectedJournalId, setSelectedJournalId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenModal = async () => {
    setError(null);
    if (journals.length === 0) {
      try {
        const rows = await fetchApi<RegisteredJournal[]>("/api/journals");
        setJournals(rows ?? []);
      } catch {
        setError("Could not load journals. Please try again.");
        return;
      }
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedJournalId || !paperId || !contractId) return;
    setSubmitting(true);
    setError(null);
    try {
      await fetchApi(`/api/papers/${paperId}/submit`, {
        method: "POST",
        body: JSON.stringify({ journalId: selectedJournalId, contractId }),
      });
      setSubmitted(true);
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="rounded-lg overflow-hidden mb-6" style={{ background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.2)" }}>
        <div className="py-4 px-6">
          <span className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px]">Contract Preview</span>
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-md p-5" style={{ background: "rgba(30,28,24,0.6)", border: "1px solid rgba(120,110,95,0.1)" }}>
            <div className="text-sm text-[#e8e0d4] italic mb-4">
              {draft ? draft.title : title || "Untitled Paper"}
            </div>

            <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-2.5">Contributors</div>
            {contributors.map((c, i) => (
              <div
                key={c.id}
                className="flex justify-between items-center py-2"
                style={{ borderBottom: i < contributors.length - 1 ? "1px solid rgba(120,110,95,0.08)" : "none" }}
              >
                <div>
                  <span className="text-[13px] text-[#d4ccc0]">{c.name}</span>
                  <span className="text-[11px] text-[#6a6050] ml-2">{c.role}</span>
                </div>
                <span className="text-[15px] text-[#c9b89e] font-sans font-semibold">{c.pct}%</span>
              </div>
            ))}

            <div
              className="mt-4 py-3 px-3.5 rounded text-[11px] text-[#8a8070] italic leading-relaxed"
              style={{ background: "rgba(120,110,95,0.06)" }}
            >
              All parties agree to the contribution split as defined above. Any modification to authorship order or contribution weights requires unanimous re-signing by all contributors. This contract is immutably recorded on Hedera.
            </div>
          </div>

          {/* Submission status & action */}
          <div className="mt-4 text-right">
            {submitted ? (
              <div>
                <div className="text-sm text-[#8fbc8f] mb-1">{"\u2713"} Paper Submitted</div>
                <div className="text-[11px] text-[#6a6050]">Your paper has been submitted to the journal and is awaiting review.</div>
              </div>
            ) : allSigned ? (
              <div>
                <div className="text-sm text-[#8fbc8f] mb-1">{"\u2713"} Contract Fully Signed</div>
                <div className="text-[11px] text-[#6a6050] mb-4">Recorded immutably on Hedera. You may now proceed to submission.</div>
                {error && <div className="text-[11px] text-[#d4645a] mb-3">{error}</div>}
                <button
                  onClick={handleOpenModal}
                  className="py-3 px-8 rounded text-[#8fbc8f] font-serif text-sm cursor-pointer tracking-wide"
                  style={{
                    background: "linear-gradient(135deg, rgba(120,180,120,0.25), rgba(100,160,100,0.15))",
                    border: "1px solid rgba(120,180,120,0.4)",
                  }}
                >Proceed to Submission {"\u2192"}</button>
              </div>
            ) : (
              <div>
                <div className="text-[13px] text-[#6a6050] mb-2">
                  {isValid
                    ? `Waiting for ${remaining} more signature${remaining > 1 ? "s" : ""}`
                    : "Contributions must total 100% before signatures"}
                </div>
                <button
                  disabled
                  className="py-3 px-8 rounded text-[#4a4238] font-serif text-sm cursor-not-allowed tracking-wide"
                  style={{
                    background: "rgba(120,110,95,0.1)",
                    border: "1px solid rgba(120,110,95,0.15)",
                  }}
                >Proceed to Submission {"\u2192"}</button>
                <div className="text-[10px] text-[#4a4238] mt-2 italic">
                  All co-authors must sign before submission
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalOverlay isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="448px">
        <h2 className="text-[16px] text-[#e8e0d4] font-serif mb-1">Select a Journal</h2>
        <p className="text-[11px] text-[#6a6050] mb-4">Choose the journal to submit your paper to.</p>

        {journals.length === 0 ? (
          <div className="text-[12px] text-[#6a6050] py-4 text-center">No journals available.</div>
        ) : (
          <div className="flex flex-col gap-2 mb-4 max-h-60 overflow-y-auto">
            {journals.map((j) => (
              <button
                key={j.id}
                onClick={() => setSelectedJournalId(j.id)}
                className="text-left rounded px-4 py-3 transition-all"
                style={{
                  background: selectedJournalId === j.id ? "rgba(120,180,120,0.1)" : "rgba(45,42,38,0.5)",
                  border: "1px solid " + (selectedJournalId === j.id ? "rgba(120,180,120,0.35)" : "rgba(120,110,95,0.2)"),
                }}
              >
                <div className="text-[13px] text-[#d4ccc0]">{j.name}</div>
                {j.reputationScore && (
                  <div className="text-[10px] text-[#6a6050] mt-0.5">Score: {j.reputationScore}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {error && <div className="text-[11px] text-[#d4645a] mb-3">{error}</div>}

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowModal(false)}
            className="py-2 px-5 rounded text-[#6a6050] font-serif text-sm cursor-pointer"
            style={{ background: "none", border: "1px solid rgba(120,110,95,0.2)" }}
          >Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!selectedJournalId || submitting}
            className="py-2 px-5 rounded font-serif text-sm"
            style={{
              background: selectedJournalId && !submitting
                ? "linear-gradient(135deg, rgba(120,180,120,0.25), rgba(100,160,100,0.15))"
                : "rgba(120,110,95,0.1)",
              border: "1px solid " + (selectedJournalId && !submitting ? "rgba(120,180,120,0.4)" : "rgba(120,110,95,0.15)"),
              color: selectedJournalId && !submitting ? "#8fbc8f" : "#4a4238",
              cursor: selectedJournalId && !submitting ? "pointer" : "not-allowed",
            }}
          >{submitting ? "Submitting\u2026" : "Submit Paper"}</button>
        </div>
      </ModalOverlay>
    </>
  );
}
