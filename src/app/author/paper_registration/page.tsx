import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/src/shared/lib/auth";
import { listUserContracts } from "@/src/features/contracts";
import { PaperRegistrationClient } from "@/src/features/author/components/paper-registration";
import { PaperRegistrationSkeleton } from "@/src/features/author/components/skeletons";
import type { ApiContract } from "@/src/shared/types/api";

async function PaperRegistrationContent() {
  const wallet = await getSession();
  if (!wallet) redirect("/login");

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
