import type { NavItemData } from "@/src/shared/types/shared";

export const navItems: NavItemData[] = [
  { label: "Dashboard", href: "/researcher", icon: "LayoutDashboard" },
  { label: "Authorship Contracts", href: "/researcher/authorship-contracts", icon: "FileSignature" },
  { label: "Paper Version Control", href: "/researcher/paper-version-control", icon: "GitBranch" },
  { label: "Create a Submission", href: "/researcher/create-submission", icon: "FilePlus" },
  { label: "View Submissions", href: "/researcher/view-submissions", icon: "Eye" },
];
