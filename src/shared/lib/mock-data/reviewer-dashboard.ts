import type {
  AssignedReview,
  CompletedReview,
  FeedbackItem,
  ReputationDataPoint,
  ReputationBreakdownItem,
  ReputationScores,
} from "@/src/shared/types/reviewer-dashboard";
import type { NavItemData, UserProfile } from "@/src/features/author/types/dashboard";

export const mockAssignedReviews: AssignedReview[] = [
  { id: 1, title: "Bayesian Optimization for Neural Architecture Search", journal: "JMLR", assigned: "2026-01-20", deadline: "2026-02-10", status: "Late", daysLeft: -2 },
  { id: 2, title: "Distributed Consensus in Heterogeneous IoT Networks", journal: "IEEE Transactions", assigned: "2026-01-28", deadline: "2026-02-12", status: "In Progress", daysLeft: 4 },
  { id: 3, title: "Fairness Constraints in Reinforcement Learning Policies", journal: "Nature ML", assigned: "2026-02-03", deadline: "2026-02-28", status: "Pending", daysLeft: 20 },
  { id: 4, title: "Zero-Shot Cross-Lingual Transfer with Adapter Modules", journal: "ACL Rolling Review", assigned: "2026-02-06", deadline: "2026-03-06", status: "Pending", daysLeft: 26 },
];

export const mockCompletedReviews: CompletedReview[] = [
  { id: 10, title: "Attention Mechanisms in Graph Transformers", journal: "NeurIPS", submitted: "2025-11-14", editorRating: 4.5, authorRating: 4.2, hash: "0xaa12...3ef0" },
  { id: 11, title: "Privacy-Preserving Federated Learning via Differential Privacy", journal: "ICML", submitted: "2025-10-02", editorRating: 4.8, authorRating: 4.6, hash: "0xbb34...7d21" },
  { id: 12, title: "Causal Discovery in High-Dimensional Time Series", journal: "JASA", submitted: "2025-08-19", editorRating: 3.9, authorRating: 3.5, hash: "0xcc56...9a43" },
  { id: 13, title: "Multi-Agent Cooperation under Partial Observability", journal: "AAMAS", submitted: "2025-06-30", editorRating: 4.2, authorRating: 4.0, hash: "0xdd78...bc65" },
  { id: 14, title: "Scalable Variational Inference for Bayesian Neural Networks", journal: "UAI", submitted: "2025-04-11", editorRating: 4.6, authorRating: 4.8, hash: "0xee9a...de87" },
];

export const mockFeedbackItems: FeedbackItem[] = [
  { reviewId: 10, usefulness: 4.2, comment: "Detailed and constructive" },
  { reviewId: 11, usefulness: 4.6, comment: "Exceptionally thorough" },
  { reviewId: 12, usefulness: 3.5, comment: "Could be more specific" },
  { reviewId: 13, usefulness: 4.0, comment: "Fair and balanced" },
  { reviewId: 14, usefulness: 4.8, comment: "Outstanding feedback quality" },
];

export const mockReputationHistory: ReputationDataPoint[] = [
  { month: "Sep 2025", score: 4.1 },
  { month: "Oct 2025", score: 4.2 },
  { month: "Nov 2025", score: 4.3 },
  { month: "Dec 2025", score: 4.2 },
  { month: "Jan 2026", score: 4.35 },
  { month: "Feb 2026", score: 4.4 },
];

export const mockReputationBreakdown: ReputationBreakdownItem[] = [
  { label: "Timeliness", value: 4.6, desc: "Avg days to deadline" },
  { label: "Editor Ratings", value: 4.4, desc: "From journal editors" },
  { label: "Author Feedback", value: 4.2, desc: "Anonymous aggregate" },
  { label: "Post-Publication", value: 4.8, desc: "No retractions impact" },
];

export const mockReputationScores: ReputationScores = {
  overall: 4.4,
  change: 0.05,
  timeliness: 4.6,
  editorAvg: 4.4,
  authorAvg: 4.2,
  postPub: 4.8,
};

export const mockReviewerUser: UserProfile = {
  name: "Dr. K. Tanaka",
  initials: "KT",
  wallet: "0x4e1b...a7f3",
  role: "Reviewer",
  notificationCount: 1,
};

export const reviewerNavItems: NavItemData[] = [
  { label: "Dashboard", href: "/reviewer" },
  { label: "Reviews", href: "/reviewer/reviews" },
  { label: "Reputation", href: "/reviewer/reputation" },
  { label: "Settings", href: "/reviewer/settings" },
];
