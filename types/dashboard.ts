export type PaperStatus =
  | "Published"
  | "Under Review"
  | "Contract Pending"
  | "Revision Requested"
  | "Draft"
  | "Submitted";

export type DashboardTab = "papers" | "pending" | "activity";

export interface Paper {
  id: number;
  title: string;
  status: PaperStatus;
  coauthors: string;
  date: string;
  hash: string;
}

export interface PendingAction {
  type: "sign" | "revision" | "review";
  text: string;
  time: string;
  urgent: boolean;
}

export interface ActivityItem {
  text: string;
  time: string;
}

export interface StatCardData {
  label: string;
  value: string;
  icon: string;
}

export interface NavItemData {
  label: string;
  href: string;
}

export interface UserProfile {
  name: string;
  initials: string;
  wallet: string;
  role: string;
  notificationCount: number;
}
