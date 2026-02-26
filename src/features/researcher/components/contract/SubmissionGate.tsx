"use client";

import { useState } from "react";
import { fetchApi } from "@/src/shared/lib/api";

interface Journal {
  id: string;
  name: string;
  reputationScore: string | null;
}

interface SubmissionGateProps {
  allSigned: boolean;
  isValid: boolean;
  signedCount: number;
  totalContributors: number;
  paperId?: string;
  contractId?: string | null;
}

export function SubmissionGate({ allSigned, isValid, signedCount, totalContributors, paperId, contractId }: SubmissionGateProps) {
  const remaining = totalContributors - signedCount;
  const [showModal, setShowModal] = useState(false);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedJournalId, setSelectedJournalId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenModal = async () => {
    setError(null);
    try {
      const rows = await fetchApi<Journal[]>("/api/journals");
      setJournals(rows ?? []);
      setShowModal(true);
    } catch {
      setError("Could not load journals. Please try again.");
    }
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
      <div
        className="rounded-lg p-6 text-center"
        style={{
          background: allSigned ? "rgba(120,180,120,0.06)" : "rgba(45,42,38,0.5)",
          border: "1px solid " + (allSigned ? "rgba(120,180,120,0.2)" : "rgba(120,110,95,0.2)"),
        }}
      >
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

      {/* Journal selection modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(10,9,8,0.7)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="rounded-lg p-6 w-full max-w-md"
            style={{ background: "#1a1816", border: "1px solid rgba(120,110,95,0.3)" }}
          >
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
              >{submitting ? "Submitting…" : "Submit Paper"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
