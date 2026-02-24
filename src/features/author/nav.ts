import type { NavItemData } from "@/src/features/author/types/dashboard";

export const navItems: NavItemData[] = [
  { label: "Dashboard", href: "/author" },
  { label: "Papers", href: "/author/paper_registration" },
  { label: "Contracts", href: "/author/contract_builder" },
  { label: "Explorer", href: "/author/public_explorer" },
];
