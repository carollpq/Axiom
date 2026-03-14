import { getSession } from '@/src/shared/lib/auth/auth';
import {
  listPendingInvites,
  buildEditorNameMap,
} from '@/src/features/reviewer/queries';
import { extractEditorWallets } from '@/src/features/reviewer/lib/dashboard';
import { IncomingInvitesClient } from '@/src/features/reviewer/components/invites/incoming-invites.client';

export default async function IncomingInvitesPage() {
  const wallet = (await getSession())!;
  const rawAssigned = await listPendingInvites(wallet);
  const editorNames = await buildEditorNameMap(
    extractEditorWallets(rawAssigned),
  );

  return (
    <IncomingInvitesClient initialRaw={rawAssigned} editorNames={editorNames} />
  );
}
