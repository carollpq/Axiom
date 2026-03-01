"use client";

import { useState } from "react";

interface OrcidVerificationStepProps {
  onVerified: (orcidId: string) => void;
  onBack: () => void;
  loading: boolean;
}

const ORCID_REGEX = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/;

export function OrcidVerificationStep({
  onVerified,
  onBack,
  loading,
}: OrcidVerificationStepProps) {
  const [orcidId, setOrcidId] = useState("");
  const [error, setError] = useState<string>();

  const validateOrcid = (value: string): boolean => {
    if (!value.trim()) {
      setError("ORCID ID is required");
      return false;
    }
    if (!ORCID_REGEX.test(value)) {
      setError("Invalid ORCID format. Expected: XXXX-XXXX-XXXX-XXXXX");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateOrcid(orcidId)) {
      setError(undefined);
      onVerified(orcidId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className="p-4 rounded"
        style={{ backgroundColor: "rgba(45, 42, 38, 0.6)" }}
      >
        <p className="text-sm mb-3" style={{ color: "#b0a898" }}>
          Verify your ORCID ID:
        </p>
        <p className="text-xs mb-4" style={{ color: "#8a8070" }}>
          Your ORCID iD is a unique identifier for your research career. Create one at{" "}
          <a
            href="https://orcid.org/register"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "#c9a44a" }}
          >
            orcid.org/register
          </a>
        </p>

        <input
          type="text"
          placeholder="XXXX-XXXX-XXXX-XXXXX"
          value={orcidId}
          onChange={e => {
            setOrcidId(e.target.value);
            setError(undefined);
          }}
          onBlur={() => {
            if (orcidId) validateOrcid(orcidId);
          }}
          disabled={loading}
          className="w-full px-3 py-2 rounded text-sm font-mono"
          style={{
            backgroundColor: "#1a1816",
            color: "#d4ccc0",
            border: error ? "1px solid #d4645a" : "1px solid #5a4a3a",
          }}
        />

        {error && (
          <p className="text-xs mt-2" style={{ color: "#d4645a" }}>
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-2 text-sm rounded transition-all"
          style={{
            backgroundColor: "transparent",
            color: "#b0a898",
            border: "1px solid #5a4a3a",
          }}
        >
          Back
        </button>

        <button
          type="submit"
          disabled={loading || !orcidId}
          className="flex-1 py-2 text-sm rounded font-semibold transition-all disabled:opacity-50"
          style={{
            backgroundColor: "#c9a44a",
            color: "#1a1816",
          }}
        >
          {loading ? "Verifying..." : "Continue"}
        </button>
      </div>
    </form>
  );
}
