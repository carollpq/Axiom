import { getSession } from '@/src/shared/lib/auth/auth';
import { listUserPapers } from '@/src/features/papers/queries';
import { PaperVersionControlClient } from '@/src/features/researcher/components/paper-version-control/paper-version-control.client';

export default async function PaperVersionControl() {
  const wallet = (await getSession())!;
  const papers = await listUserPapers(wallet);

  const papersWithVersions = papers.map((p) => ({
    id: p.id,
    title: p.title,
    versions: (p.versions ?? []).map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      paperHash: v.paperHash,
      fileStorageKey: v.fileStorageKey,
      createdAt: v.createdAt,
    })),
  }));

  return <PaperVersionControlClient papers={papersWithVersions} />;
}
