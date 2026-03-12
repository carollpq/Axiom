import { getSession } from '@/src/shared/lib/auth/auth';
import {
  listPendingPoolInvites,
  buildEditorNameMap,
} from '@/src/features/reviewer/queries';
import { PoolInvitesClient } from '@/src/features/reviewer/components/pool-invites/pool-invites.client';

export default async function PoolInvitesPage() {
  const wallet = (await getSession())!;
  const invites = await listPendingPoolInvites(wallet);
  const editorNames = await buildEditorNameMap(
    invites.map((i) => i.journal?.editorWallet).filter((w): w is string => !!w),
  );

  return (
    <PoolInvitesClient initialInvites={invites} editorNames={editorNames} />
  );
}
