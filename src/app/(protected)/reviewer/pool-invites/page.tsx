import { getSession } from '@/src/shared/lib/auth/auth';
import {
  listPendingPoolInvites,
  buildEditorNameMapFromPoolInvites,
} from '@/src/features/reviewer/queries';
import { PoolInvitesClient } from '@/src/features/reviewer/components/pool-invites/pool-invites.client';

export default async function PoolInvitesPage() {
  const wallet = (await getSession())!;
  const invites = await listPendingPoolInvites(wallet);
  const editorNames = await buildEditorNameMapFromPoolInvites(invites);

  return (
    <PoolInvitesClient initialInvites={invites} editorNames={editorNames} />
  );
}
