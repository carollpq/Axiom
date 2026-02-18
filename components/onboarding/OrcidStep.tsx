interface OrcidStepProps {
  orcidId: string;
  setOrcidId: (value: string) => void;
  orcidError: string;
  isValidatingOrcid: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function OrcidStep({
  orcidId,
  setOrcidId,
  orcidError,
  isValidatingOrcid,
  onSubmit,
}: OrcidStepProps) {
  return (
    <div className="w-full max-w-md bg-zinc-900 p-6 rounded-lg border border-zinc-800">
      <h2 className="text-xl font-semibold text-zinc-100 mb-4">
        Link Your ORCID
      </h2>
      <p className="text-zinc-400 text-sm mb-6">
        Please enter your ORCID iD to continue. This helps verify your identity
        in the research community.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="orcid"
            className="block text-sm font-medium text-zinc-300 mb-2"
          >
            ORCID iD
          </label>
          <input
            id="orcid"
            type="text"
            value={orcidId}
            onChange={(e) => setOrcidId(e.target.value)}
            placeholder="0000-0000-0000-0000"
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isValidatingOrcid}
          />
          {orcidError && (
            <p className="text-red-400 text-sm mt-2">{orcidError}</p>
          )}
          <p className="text-zinc-500 text-xs mt-2">
            Don&apos;t have an ORCID?{" "}
            <a
              href="https://orcid.org/register"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              Create one here
            </a>
          </p>
        </div>

        <button
          type="submit"
          disabled={isValidatingOrcid || !orcidId}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors"
        >
          {isValidatingOrcid ? "Validating..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
