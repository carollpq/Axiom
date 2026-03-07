import type { NavItemData } from "@/src/shared/types/shared";

export const reviewerNavItems: NavItemData[] = [
  { label: "Dashboard", href: "/reviewer", icon: "LayoutDashboard" },
  { label: "Incoming Invites", href: "/reviewer/invites", icon: "Mail" },
  { label: "Papers Under Review", href: "/reviewer/assigned", icon: "FileText" },
  { label: "Completed Papers", href: "/reviewer/completed", icon: "CheckCircle" },
];
