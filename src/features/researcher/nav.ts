import type { NavItemData } from "@/src/features/researcher/types/dashboard";

export const navItems: NavItemData[] = [
  { label: "Dashboard", href: "/researcher" },
  { label: "Authorship Contracts", href: "/researcher/authorship-contracts" },
  { label: "Paper Version Control", href: "/researcher/paper-version-control" },
  { label: "Create a Submission", href: "/researcher/create-submission" },
  { label: "View Submissions", href: "/researcher/view-submissions" },
];
