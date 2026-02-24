import type { UserRole } from "@/src/features/author/hooks/useOnboarding";

interface RoleSelectionStepProps {
  onSelectRole: (role: UserRole) => void;
  onBack: () => void;
}

export function RoleSelectionStep({
  onSelectRole,
  onBack,
}: RoleSelectionStepProps) {
  return (
    <div className="w-full max-w-md bg-zinc-900 p-6 rounded-lg border border-zinc-800">
      <h2 className="text-xl font-semibold text-zinc-100 mb-4">
        Select Your Role
      </h2>
      <p className="text-zinc-400 text-sm mb-6">
        Choose how you want to use Axiom. You can register as both roles
        separately if needed.
      </p>

      <div className="space-y-4">
        <button
          onClick={() => onSelectRole("researcher")}
          className="w-full p-4 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded-lg text-left transition-colors group"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium text-zinc-100 mb-1 group-hover:text-blue-400">
                Researcher / Author
              </h3>
              <p className="text-zinc-400 text-sm">
                Submit papers, register drafts, and manage authorship contracts
              </p>
            </div>
            <svg
              className="w-6 h-6 text-zinc-600 group-hover:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>

        <button
          onClick={() => onSelectRole("reviewer")}
          className="w-full p-4 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded-lg text-left transition-colors group"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium text-zinc-100 mb-1 group-hover:text-blue-400">
                Reviewer
              </h3>
              <p className="text-zinc-400 text-sm">
                Review papers, build reputation, and provide feedback
              </p>
            </div>
            <svg
              className="w-6 h-6 text-zinc-600 group-hover:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>
      </div>

      <button
        onClick={onBack}
        className="w-full mt-4 px-4 py-2 text-zinc-400 hover:text-zinc-300 text-sm"
      >
        &larr; Back to ORCID
      </button>
    </div>
  );
}
