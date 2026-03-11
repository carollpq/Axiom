import { getSession } from '@/src/shared/lib/auth/auth';
import {
  listPendingInvites,
  buildEditorNameMap,
} from '@/src/features/reviewer/queries';
import { IncomingInvitesClient } from '@/src/features/reviewer/components/invites/incoming-invites.client';

export default async function IncomingInvitesPage() {
  const wallet = (await getSession())!;
  const rawAssigned = await listPendingInvites(wallet);
  const editorNames = await buildEditorNameMap(
    rawAssigned
      .map((a) => a.submission.journal?.editorWallet)
      .filter((w): w is string => !!w),
  );

  return (
    <IncomingInvitesClient initialRaw={rawAssigned} editorNames={editorNames} />
  );
}
