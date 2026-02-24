import { redirect } from "next/navigation";
import { getSession } from "@/src/shared/lib/auth/auth";
import { listUserContracts } from "@/src/features/contracts/queries";
import { listJournals } from "@/src/features/journal/queries";
import { PaperRegistrationClient } from "@/src/features/author/components/paper-registration";
import type { ApiContract } from "@/src/shared/types/api";
import type { RegisteredJournal } from "@/src/features/author/types/paper-registration";

export default async function PaperRegistration() {
  const wallet = await getSession();
  if (!wallet) redirect("/login");

  const [contracts, journals] = await Promise.all([
    listUserContracts(wallet),
    listJournals(),
  ]);

  return (
    <PaperRegistrationClient
      initialContracts={contracts as unknown as ApiContract[]}
      initialJournals={journals as RegisteredJournal[]}
    />
  );
}
