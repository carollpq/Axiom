"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { TabBar } from "@/src/shared/components";
import type { DashboardTab } from "@/src/features/author/types/dashboard";

const TABS = [
  { key: "papers" as const, label: "Papers", count: null },
  { key: "pending" as const, label: "Pending Actions", count: null },
];

interface Props {
  papersSection: ReactNode;
  pendingSection: ReactNode;
}

export function TabsShellClient({ papersSection, pendingSection }: Props) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("papers");

  return (
    <>
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "papers" && papersSection}
      {activeTab === "pending" && pendingSection}
    </>
  );
}
