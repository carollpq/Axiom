import type { NavItemData } from "@/src/features/researcher/types/dashboard";

export const navItems: NavItemData[] = [
  { label: "Dashboard", href: "/researcher" },
  { label: "Papers", href: "/researcher/paper_registration" },
  { label: "Contracts", href: "/researcher/contract_builder" },
  { label: "Explorer", href: "/researcher/public_explorer" },
];
