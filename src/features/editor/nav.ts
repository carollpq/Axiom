import type { NavItemData } from "@/src/shared/types/shared";

export const journalNavItems: NavItemData[] = [
  { label: "Dashboard", href: "/editor", icon: "LayoutDashboard" },
  { label: "Incoming Papers", href: "/editor/incoming", icon: "Inbox" },
  { label: "Papers Under Review", href: "/editor/under-review", icon: "BookOpen" },
  { label: "Accepted Papers", href: "/editor/accepted", icon: "CheckCircle" },
  { label: "Journal Management", href: "/editor/management", icon: "Settings" },
];
