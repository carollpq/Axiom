"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface PaperOption {
  id: string;
  title: string;
  versions: { id: string; versionNumber: number }[];
}

interface JournalOption {
  id: string;
  name: string;
}

interface ContractOption {
  id: string;
  paperTitle: string;
  contributors: string;
}

interface Props {
  papers: PaperOption[];
  journals: JournalOption[];
  contracts: ContractOption[];
}

export function CreateSubmissionClient({ papers, journals, contracts }: Props) {
  const router = useRouter();
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [selectedJournalId, setSelectedJournalId] = useState("");
  const [selectedContractId, setSelectedContractId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPaper = useMemo(
    () => papers.find((p) => p.id === selectedPaperId),
    [papers, selectedPaperId],
  );

  const versions = selectedPaper?.versions ?? [];

  const handlePaperChange = (paperId: string) => {
    setSelectedPaperId(paperId);
    setSelectedVersionId("");
  };

  const canSubmit =
    selectedPaperId &&
    selectedVersionId &&
    selectedJournalId &&
    selectedContractId;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/papers/${selectedPaperId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journalId: selectedJournalId,
          versionId: selectedVersionId,
          contractId: selectedContractId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }

      router.push("/researcher");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-10">
      <h1 className="text-[28px] font-serif font-normal text-[#e8e0d4] mb-1">
        Create a Submission
      </h1>
      <p className="text-[13px] text-[#6a6050] italic mb-6">
        Submit your paper to a journal for review
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

      {/* Submission Form */}
      <div
        className="rounded-md p-6"
        style={{
          background: "rgba(45,42,38,0.4)",
          border: "1px solid rgba(120,110,95,0.15)",
        }}
      >
        {/* Paper Title */}
        <div className="flex items-center gap-6 mb-5">
          <label className="text-[13px] text-[#b0a898] w-[200px] shrink-0">
            Paper Title
          </label>
          <select
            value={selectedPaperId}
            onChange={(e) => handlePaperChange(e.target.value)}
            disabled={submitting}
            className="flex-1 px-3 py-2.5 rounded-md text-[13px] font-serif text-[#d4ccc0] cursor-pointer"
            style={{
              background: "rgba(35,32,28,0.8)",
              border: "1px solid rgba(120,110,95,0.2)",
            }}
          >
            <option value="">Select a paper from your repository</option>
            {papers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Paper Version */}
        <div className="flex items-center gap-6 mb-5">
          <label className="text-[13px] text-[#b0a898] w-[200px] shrink-0">
            Paper Version
          </label>
          <select
            value={selectedVersionId}
            onChange={(e) => setSelectedVersionId(e.target.value)}
            disabled={!selectedPaperId || submitting}
            className="flex-1 px-3 py-2.5 rounded-md text-[13px] font-serif text-[#d4ccc0] cursor-pointer"
            style={{
              background: "rgba(35,32,28,0.8)",
              border: "1px solid rgba(120,110,95,0.2)",
              opacity: selectedPaperId ? 1 : 0.5,
            }}
          >
            <option value="">Select a version</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                Version {v.versionNumber}
              </option>
            ))}
          </select>
        </div>

        {/* Journal Name */}
        <div className="flex items-center gap-6 mb-5">
          <label className="text-[13px] text-[#b0a898] w-[200px] shrink-0">
            Journal Name
          </label>
          <select
            value={selectedJournalId}
            onChange={(e) => setSelectedJournalId(e.target.value)}
            disabled={submitting}
            className="flex-1 px-3 py-2.5 rounded-md text-[13px] font-serif text-[#d4ccc0] cursor-pointer"
            style={{
              background: "rgba(35,32,28,0.8)",
              border: "1px solid rgba(120,110,95,0.2)",
            }}
          >
            <option value="">Select a journal</option>
            {journals.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
        </div>

        {/* Associated Authorship Contract */}
        <div className="flex items-center gap-6 mb-5">
          <label className="text-[13px] text-[#b0a898] w-[200px] shrink-0">
            Associated Authorship Contract
          </label>
          <select
            value={selectedContractId}
            onChange={(e) => setSelectedContractId(e.target.value)}
            disabled={submitting}
            className="flex-1 px-3 py-2.5 rounded-md text-[13px] font-serif text-[#d4ccc0] cursor-pointer"
            style={{
              background: "rgba(35,32,28,0.8)",
              border: "1px solid rgba(120,110,95,0.2)",
            }}
          >
            <option value="">Select a completed contract</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.paperTitle} ({c.contributors})
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="px-6 py-2.5 rounded-md text-[13px] font-medium cursor-pointer transition-colors"
            style={{
              background: canSubmit
                ? "rgba(143,188,143,0.2)"
                : "rgba(120,110,95,0.1)",
              color: canSubmit ? "#8fbc8f" : "#6a6050",
              border: `1px solid ${canSubmit ? "rgba(143,188,143,0.3)" : "rgba(120,110,95,0.15)"}`,
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
