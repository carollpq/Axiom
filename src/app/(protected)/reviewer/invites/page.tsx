import { getSession } from '@/src/shared/lib/auth/auth';
import {
  listAssignedReviews,
  buildEditorNameMap,
} from '@/src/features/reviewer/queries';
import { IncomingInvitesClient } from '@/src/features/reviewer/components/invites/incoming-invites.client';

export default async function IncomingInvitesPage() {
  const wallet = (await getSession())!;
  const rawAssigned = await listAssignedReviews(wallet);
  const editorNames = await buildEditorNameMap(rawAssigned);

  return (
    <IncomingInvitesClient initialRaw={rawAssigned} editorNames={editorNames} />
  );
}
