import { ScrollText, PenLine, Clock, Sparkles } from "lucide-react";
import type {
  PaperRow,
  PendingAction,
  StatCardData,
  UserProfile,
  PaperStatus,
} from "@/src/features/author/types/dashboard";

export const mockPapers: PaperRow[] = [
  { id: "1", title: "On the Reproducibility of Transformer Architectures in Low-Resource Settings", status: "Published", coauthors: "M. Chen, L. Vasquez", date: "2025-11-02", hash: "0x3a9f...c2e1" },
  { id: "2", title: "Causal Inference Methods for Observational Climate Data", status: "Under Review", coauthors: "R. Okafor", date: "2025-12-18", hash: "0x7b2d...f891" },
  { id: "3", title: "Adversarial Robustness in Federated Learning Protocols", status: "Contract Pending", coauthors: "J. Kim, A. Petrov, S. Huang", date: "2026-01-10", hash: "0x1e4c...a3b7" },
  { id: "4", title: "Graph Neural Networks for Protein Folding Prediction", status: "Revision Requested", coauthors: "T. Nakamura", date: "2026-01-22", hash: "0x9f0a...d5c3" },
  { id: "5", title: "Quantum Error Correction in Noisy Intermediate-Scale Devices", status: "Draft", coauthors: "\u2014", date: "2026-02-05", hash: "0xb8e2...7f04" },
];

export const mockPendingActions: PendingAction[] = [
  { type: "sign", text: 'Sign authorship contract for "Adversarial Robustness in Federated Learning Protocols"', time: "2 days ago", urgent: true },
  { type: "revision", text: 'Revision requested for "Graph Neural Networks for Protein Folding Prediction"', time: "5 days ago", urgent: true },
  { type: "review", text: 'Review received for "Causal Inference Methods for Observational Climate Data"', time: "1 week ago", urgent: false },
];

export const mockStats: StatCardData[] = [
  { label: "Total Papers", value: "5", icon: ScrollText },
  { label: "Pending Contracts", value: "1", icon: PenLine },
  { label: "Under Review", value: "1", icon: Clock },
  { label: "Published", value: "1", icon: Sparkles },
];

export const mockUser: UserProfile = {
  name: "Dr. A. Reeves",
  initials: "DR",
  wallet: "0x7f3a...9c2d",
  role: "Author",
  notificationCount: 3,
};

export const paperStatuses: PaperStatus[] = [
  "Draft",
  "Contract Pending",
  "Under Review",
  "Revision Requested",
  "Published",
];
