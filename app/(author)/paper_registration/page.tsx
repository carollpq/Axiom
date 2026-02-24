import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { listUserContracts } from "@/features/contracts";
import { PaperRegistrationClient } from "@/components/paper-registration";
import { PaperRegistrationSkeleton } from "@/components/shared/skeletons";
import type { ApiContract } from "@/types/api";

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
