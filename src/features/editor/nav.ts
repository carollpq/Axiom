import type { NavItemData } from "@/src/shared/types/shared";

export const journalNavItems: NavItemData[] = [
  { label: "Dashboard", href: "/editor" },
  { label: "Incoming Papers", href: "/editor/incoming" },
  { label: "Papers Under Review", href: "/editor/under-review" },
  { label: "Accepted Papers", href: "/editor/accepted" },
  { label: "Journal Management", href: "/editor/management" },
];
