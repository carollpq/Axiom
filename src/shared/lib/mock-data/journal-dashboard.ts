import type {
  JournalSubmission,
  SubmissionStage,
  StageFilter,
  StageColorConfig,
  PoolReviewer,
  ReviewCriterion,
} from "@/src/shared/types/journal-dashboard";
import type { NavItemData, UserProfile } from "@/features/author/types/dashboard";

export const mockSubmissions: JournalSubmission[] = [
  { id: 1, title: "On the Reproducibility of Transformer Architectures in Low-Resource Settings", authors: "A. Reeves, M. Chen, L. Vasquez", submitted: "2025-10-15", stage: "Published", reviewers: ["R-4821", "R-7293"], deadline: "2025-11-15", criteriaPublished: true, criteriaMet: true, hash: "0x3a9f...c2e1" },
  { id: 2, title: "Causal Inference Methods for Observational Climate Data", authors: "A. Reeves, R. Okafor", submitted: "2025-12-18", stage: "Under Review", reviewers: ["R-1156", "R-8830"], deadline: "2026-02-18", criteriaPublished: true, criteriaMet: null, hash: "0x7b2d...f891" },
  { id: 3, title: "Topological Data Analysis for Gene Regulatory Networks", authors: "P. Moreau, J. Singh", submitted: "2026-01-05", stage: "Reviewers Assigned", reviewers: ["R-3342"], deadline: "2026-03-05", criteriaPublished: true, criteriaMet: null, hash: "0xf1a0...e4b2" },
  { id: 4, title: "Efficient Sparse Attention for Long Document Summarization", authors: "H. Liu, S. Park", submitted: "2026-01-20", stage: "Criteria Published", reviewers: [], deadline: "2026-03-20", criteriaPublished: true, criteriaMet: null, hash: "0x82cd...51a9" },
  { id: 5, title: "Robustness of Diffusion Models under Distribution Shift", authors: "T. Nakamura, Y. Zhao", submitted: "2026-02-01", stage: "New", reviewers: [], deadline: null, criteriaPublished: false, criteriaMet: null, hash: "0xd9e3...b7f0" },
  { id: 6, title: "Neural Symbolic Integration for Mathematical Reasoning", authors: "C. Weber, M. Ali", submitted: "2026-02-04", stage: "New", reviewers: [], deadline: null, criteriaPublished: false, criteriaMet: null, hash: "0xa4b1...c3d8" },
  { id: 7, title: "Privacy-Preserving Federated Learning via Differential Privacy", authors: "K. Tanaka, L. Fernandez", submitted: "2025-09-10", stage: "Decision Pending", reviewers: ["R-4821", "R-5567", "R-1156"], deadline: "2025-11-10", criteriaPublished: true, criteriaMet: true, hash: "0xbb34...7d21" },
  { id: 8, title: "Continual Learning Without Catastrophic Forgetting in Vision Transformers", authors: "D. Osei, R. Gupta", submitted: "2025-08-22", stage: "Rejected", reviewers: ["R-8830", "R-3342"], deadline: "2025-10-22", criteriaPublished: true, criteriaMet: false, hash: "0x56ef...a912" },
];

export const stages: StageFilter[] = [
  "All",
  "New",
  "Criteria Published",
  "Reviewers Assigned",
  "Under Review",
  "Decision Pending",
  "Published",
  "Rejected",
];

export const pipelineStages: SubmissionStage[] = [
  "New",
  "Criteria Published",
  "Reviewers Assigned",
  "Under Review",
  "Decision Pending",
  "Published",
  "Rejected",
];

export const stageColors: Record<SubmissionStage, StageColorConfig> = {
  "New": { bg: "rgba(150,150,170,0.15)", text: "#9a9aad", border: "rgba(150,150,170,0.3)" },
  "Criteria Published": { bg: "rgba(130,160,200,0.15)", text: "#7a9fc7", border: "rgba(130,160,200,0.3)" },
  "Reviewers Assigned": { bg: "rgba(160,140,200,0.15)", text: "#a98fc7", border: "rgba(160,140,200,0.3)" },
  "Under Review": { bg: "rgba(180,180,120,0.15)", text: "#c9b458", border: "rgba(180,180,120,0.3)" },
  "Decision Pending": { bg: "rgba(200,160,100,0.15)", text: "#c4956a", border: "rgba(200,160,100,0.3)" },
  "Published": { bg: "rgba(120,180,120,0.15)", text: "#8fbc8f", border: "rgba(120,180,120,0.3)" },
  "Rejected": { bg: "rgba(200,100,90,0.15)", text: "#d4645a", border: "rgba(200,100,90,0.3)" },
};

export const mockReviewerPool: PoolReviewer[] = [
  { id: "R-1156", name: "Dr. S. Patel", field: "Machine Learning", score: 4.6, orcid: "0000-0002-1234-5678", reviews: 34 },
  { id: "R-3342", name: "Dr. L. Fernandez", field: "Computational Biology", score: 4.3, orcid: "0000-0003-8765-4321", reviews: 22 },
  { id: "R-4821", name: "Dr. K. Tanaka", field: "Statistical Learning", score: 4.4, orcid: "0000-0001-5678-9012", reviews: 41 },
  { id: "R-5567", name: "Dr. A. Novak", field: "NLP", score: 4.1, orcid: "0000-0002-9012-3456", reviews: 18 },
  { id: "R-7293", name: "Dr. M. Okonkwo", field: "Computer Vision", score: 4.7, orcid: "0000-0003-3456-7890", reviews: 29 },
  { id: "R-8830", name: "Dr. J. Moreau", field: "Optimization", score: 3.9, orcid: "0000-0001-7890-1234", reviews: 15 },
];

export const mockCriteria: ReviewCriterion[] = [
  { label: "Methodology is reproducible", type: "Yes / No / Partially" },
  { label: "Statistical analysis is appropriate", type: "Yes / No / Partially" },
  { label: "Dataset is accessible and described", type: "Yes / No / Partially" },
  { label: "Claims are supported by evidence", type: "Yes / No / Partially" },
  { label: "Related work is adequately cited", type: "Yes / No / Partially" },
];

export const detailTabs = ["info", "criteria", "reviewers", "decision"] as const;

export const journalStats = {
  avgReviewDays: 38,
  acceptRate: 62,
  journalScore: 4.3,
};

export const provenanceHashes: Record<string, string> = {
  Dataset: "0x8c3f...a1b2",
  "Code Commit": "0x2d7e...f4c9",
  Environment: "0x5a91...d3e8",
};

export const mockJournalUser: UserProfile = {
  name: "Journal of Computational Research",
  initials: "JC",
  wallet: "0x91c2...d4e7",
  role: "Editor",
  notificationCount: 2,
};

export const journalNavItems: NavItemData[] = [
  { label: "Dashboard", href: "/journal" },
  { label: "Submissions", href: "/journal/submissions" },
  { label: "Criteria", href: "/journal/criteria" },
  { label: "Settings", href: "/journal/settings" },
];
