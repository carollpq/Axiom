export type PaperStatus =
  | "Published"
  | "Under Review"
  | "Contract Pending"
  | "Revision Requested"
  | "Draft"
  | "Submitted";

export type DashboardTab = "papers" | "pending" | "activity";

export interface PaperRow {
  id: string;
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

export type { NavItemData, UserProfile } from "@/src/shared/types/shared";
