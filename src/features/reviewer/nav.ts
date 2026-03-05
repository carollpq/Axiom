import type { NavItemData } from "@/src/shared/types/shared";

export const reviewerNavItems: NavItemData[] = [
  { label: "Dashboard", href: "/reviewer", icon: "LayoutDashboard" },
  { label: "Reviews", href: "/reviewer/reviews", icon: "ClipboardList" },
  { label: "Reputation", href: "/reviewer/reputation", icon: "Award" },
  { label: "Settings", href: "/reviewer/settings", icon: "Settings" },
];
