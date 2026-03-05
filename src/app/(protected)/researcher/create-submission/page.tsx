import { getSession } from "@/src/shared/lib/auth/auth";
import { listUserPapers } from "@/src/features/papers/queries";
import { listUserContracts } from "@/src/features/contracts/queries";
import { listJournals } from "@/src/features/editor/queries";
import { CreateSubmissionClient } from "@/src/features/researcher/components/create-submission/CreateSubmission.client";

export default async function CreateSubmission() {
  const wallet = (await getSession())!;

  const [papers, contracts, journals] = await Promise.all([
    listUserPapers(wallet),
    listUserContracts(wallet),
    listJournals(),
  ]);

  // Papers that have at least one version
  const paperOptions = papers
    .filter((p) => p.versions && p.versions.length > 0)
    .map((p) => ({
      id: p.id,
      title: p.title,
      versions: p.versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
      })),
    }));

  // Only fully signed contracts
  const contractOptions = contracts
    .filter((c) => c.status === "fully_signed")
    .map((c) => ({
      id: c.id,
      paperTitle: c.paperTitle,
      contributors: c.contributors
        .map((cc) => cc.contributorName ?? "Unknown")
        .join(", "),
    }));

  const journalOptions = journals.map((j) => ({
    id: j.id,
    name: j.name,
  }));

  return (
    <CreateSubmissionClient
      papers={paperOptions}
      journals={journalOptions}
      contracts={contractOptions}
    />
  );
}
