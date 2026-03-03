"use client";

import { useState } from "react";
import { ORCID_REGEX } from "@/src/shared/lib/validation";

interface OrcidVerificationStepProps {
  onVerified: (orcidId: string, displayName: string) => void;
  onBack: () => void;
  loading: boolean;
}

export function OrcidVerificationStep({
  onVerified,
  onBack,
  loading,
}: OrcidVerificationStepProps) {
  const [displayName, setDisplayName] = useState("");
  const [orcidId, setOrcidId] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [orcidError, setOrcidError] = useState<string>();

  const validate = (): boolean => {
    setNameError(undefined);
    setOrcidError(undefined);
    if (!displayName.trim()) {
      setNameError("Display name is required");
      return false;
    }
    if (!orcidId.trim()) {
      setOrcidError("ORCID ID is required");
      return false;
    }
    if (!ORCID_REGEX.test(orcidId)) {
      setOrcidError("Invalid ORCID format. Expected: XXXX-XXXX-XXXX-XXXX");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onVerified(orcidId, displayName.trim());
    }
  };

  const inputBase = { backgroundColor: "#1a1816", color: "#d4ccc0" };
  const borderOk = "1px solid #5a4a3a";
  const borderErr = "1px solid #d4645a";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className="p-4 rounded space-y-4"
        style={{ backgroundColor: "rgba(45, 42, 38, 0.6)" }}
      >
        <div>
          <p className="text-sm mb-2" style={{ color: "#b0a898" }}>
            Display name
          </p>
          <input
            type="text"
            placeholder="e.g. Dr. Jane Smith"
            value={displayName}
            onChange={e => {
              setDisplayName(e.target.value);
              setNameError(undefined);
            }}
            disabled={loading}
            className="w-full px-3 py-2 rounded text-sm"
            style={{ ...inputBase, border: nameError ? borderErr : borderOk }}
          />
          {nameError && (
            <p className="text-xs mt-1" style={{ color: "#d4645a" }}>
              {nameError}
            </p>
          )}
        </div>

        <div>
          <p className="text-sm mb-2" style={{ color: "#b0a898" }}>
            ORCID iD
          </p>
          <p className="text-xs mb-2" style={{ color: "#8a8070" }}>
            A unique identifier for your research career. Create one at{" "}
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
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={orcidId}
            onChange={e => {
              setOrcidId(e.target.value);
              setOrcidError(undefined);
            }}
            onBlur={() => {
              if (orcidId && !ORCID_REGEX.test(orcidId)) {
                setOrcidError("Invalid ORCID format. Expected: XXXX-XXXX-XXXX-XXXX");
              }
            }}
            disabled={loading}
            className="w-full px-3 py-2 rounded text-sm font-mono"
            style={{ ...inputBase, border: orcidError ? borderErr : borderOk }}
          />
          {orcidError && (
            <p className="text-xs mt-1" style={{ color: "#d4645a" }}>
              {orcidError}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-2 text-sm rounded transition-all cursor-pointer hover:brightness-110"
          style={{
            backgroundColor: "transparent",
            color: "#b0a898",
            border: "1px solid #5a4a3a",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "rgba(201, 164, 74, 0.5)";
            e.currentTarget.style.color = "#d4ccc0";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "#5a4a3a";
            e.currentTarget.style.color = "#b0a898";
          }}
        >
          Back
        </button>

        <button
          type="submit"
          disabled={loading || !orcidId || !displayName.trim()}
          className="flex-1 py-2 text-sm rounded font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "#c9a44a",
            color: "#1a1816",
          }}
          onMouseEnter={e => {
            if (!e.currentTarget.disabled)
              e.currentTarget.style.backgroundColor = "#d4b45a";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = "#c9a44a";
          }}
        >
          {loading ? "Verifying..." : "Continue"}
        </button>
      </div>
    </form>
  );
}
