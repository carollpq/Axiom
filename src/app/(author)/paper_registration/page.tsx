import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { listUserContracts } from "@/features/contracts";
import { PaperRegistrationClient } from "@/features/author/components/paper-registration";
import { PaperRegistrationSkeleton } from "@/features/author/components/skeletons";
import type { ApiContract } from "@/src/shared/types/api";

async function PaperRegistrationContent() {
  const wallet = await getSession();
  if (!wallet) redirect("/");

  const contracts = listUserContracts(wallet) as unknown as ApiContract[];

  return <PaperRegistrationClient initialContracts={contracts} />;
}

export default function PaperRegistration() {
  return (
    <Suspense fallback={<PaperRegistrationSkeleton />}>
      <PaperRegistrationContent />
    </Suspense>
  );
}
