import type {
  PaperCardData,
  PoolReviewer,
  ReviewerWithStatus,
  EditorProfile,
  JournalIssue,
} from "@/src/features/editor/types";

/* ── Editor profile ── */

export const mockEditorProfile: EditorProfile = {
  name: "Dr. Sarah Chen",
  initials: "SC",
  affiliation: "Stanford University",
  journalName: "Journal of Computational Research",
};

/* ── Papers by stage ── */

export const mockIncomingPapers: PaperCardData[] = [
  {
    id: "p1", paperId: "p1", hasLitData: false,
    title: "Quantum Error Correction Using Topological Codes in Noisy Environments",
    authors: "A. Rodriguez, B. Kim, C. Patel",
    abstractSnippet:
      "We present a novel approach to quantum error correction leveraging topological codes that demonstrate improved resilience to noise in intermediate-scale quantum devices...",
    submittedDate: "2026-02-20",
  },
  {
    id: "p2", paperId: "p2", hasLitData: false,
    title: "Federated Learning for Privacy-Preserving Medical Image Analysis",
    authors: "M. Zhang, L. Thompson",
    abstractSnippet:
      "This study introduces a federated learning framework enabling collaborative training of medical imaging models across hospital networks without sharing patient data...",
    submittedDate: "2026-02-18",
  },
  {
    id: "p3", paperId: "p3", hasLitData: false,
    title: "Scalable Graph Neural Networks for Molecular Property Prediction",
    authors: "J. Park, S. Müller, R. Gupta",
    abstractSnippet:
      "We propose a scalable architecture for graph neural networks that achieves state-of-the-art accuracy in molecular property prediction while reducing computational cost...",
    submittedDate: "2026-02-15",
  },
  {
    id: "p4", paperId: "p4", hasLitData: false,
    title: "Causal Inference in High-Dimensional Observational Studies",
    authors: "D. Williams, E. Nakamura",
    abstractSnippet:
      "This paper develops new methods for causal inference when the number of potential confounders exceeds the sample size, with applications to genomics and economics...",
    submittedDate: "2026-02-12",
  },
];

export const mockUnderReviewPapers: PaperCardData[] = [
  {
    id: "p5", paperId: "p5", hasLitData: false,
    title: "Transformer Architectures for Long-Range Sequence Modeling",
    authors: "H. Li, F. Okonkwo, A. Sharma",
    abstractSnippet:
      "We evaluate extensions to the standard transformer architecture that improve modeling of sequences exceeding 100k tokens while maintaining linear memory complexity...",
    submittedDate: "2026-01-28",
  },
  {
    id: "p6", paperId: "p6", hasLitData: false,
    title: "Adversarial Robustness in Multi-Modal Foundation Models",
    authors: "K. Tanaka, P. Costa",
    abstractSnippet:
      "This work investigates vulnerabilities of multi-modal foundation models to adversarial attacks that exploit cross-modal interactions between vision and language...",
    submittedDate: "2026-01-22",
  },
  {
    id: "p7", paperId: "p7", hasLitData: false,
    title: "Bayesian Optimization for Automated Hyperparameter Tuning at Scale",
    authors: "R. Singh, M. Dubois, C. Lee",
    abstractSnippet:
      "We present a distributed Bayesian optimization framework that efficiently tunes hyperparameters across thousands of parallel training jobs on commodity hardware...",
    submittedDate: "2026-01-15",
  },
];

export const mockAcceptedPapers: PaperCardData[] = [
  {
    id: "p8", paperId: "p8", hasLitData: false,
    title: "Neural Architecture Search with Hardware-Aware Constraints",
    authors: "T. Brown, Y. Suzuki",
    abstractSnippet:
      "This paper presents a hardware-aware neural architecture search method that co-optimizes model accuracy and inference latency on edge devices...",
    submittedDate: "2025-12-10",
  },
  {
    id: "p9", paperId: "p9", hasLitData: false,
    title: "Self-Supervised Learning for Low-Resource Language Understanding",
    authors: "N. Osei, B. Petrov, A. Mahmoud",
    abstractSnippet:
      "We introduce a self-supervised pre-training strategy for low-resource languages that leverages cross-lingual transfer from high-resource language models...",
    submittedDate: "2025-12-05",
  },
];

/* ── Reviewer pool ── */

export const mockReviewerPool: PoolReviewer[] = [
  { id: "r1", name: "Dr. Emily Watson", field: "Machine Learning", score: 4.7, orcid: "0000-0001-2345-6789", reviews: 23, wallet: "0xmock1", institution: "MIT" },
  { id: "r2", name: "Dr. James Liu", field: "Quantum Computing", score: 4.5, orcid: "0000-0002-3456-7890", reviews: 18, wallet: "0xmock2", institution: "Stanford University" },
  { id: "r3", name: "Dr. Priya Mehta", field: "NLP", score: 4.2, orcid: "0000-0003-4567-8901", reviews: 31, wallet: "0xmock3", institution: "Oxford University" },
  { id: "r4", name: "Dr. Carlos Rivera", field: "Computer Vision", score: 3.9, orcid: "0000-0004-5678-9012", reviews: 12, wallet: "0xmock4", institution: "ETH Zurich" },
  { id: "r5", name: "Dr. Anna Kowalski", field: "Statistics", score: 4.8, orcid: "0000-0005-6789-0123", reviews: 27, wallet: "0xmock5", institution: "Cambridge University" },
  { id: "r6", name: "Dr. Omar Hassan", field: "Distributed Systems", score: 4.1, orcid: "0000-0006-7890-1234", reviews: 15, wallet: "0xmock6", institution: "Carnegie Mellon" },
];

/* ── Review statuses (for under-review view) ── */

export const mockReviewStatuses: Record<string, ReviewerWithStatus[]> = {
  p5: [
    { id: "r1", name: "Dr. Emily Watson", status: "complete", hasComment: true },
    { id: "r3", name: "Dr. Priya Mehta", status: "in_progress", hasComment: false },
    { id: "r5", name: "Dr. Anna Kowalski", status: "complete", hasComment: true },
  ],
  p6: [
    { id: "r2", name: "Dr. James Liu", status: "rejected", hasComment: false },
    { id: "r4", name: "Dr. Carlos Rivera", status: "in_progress", hasComment: false },
    { id: "r6", name: "Dr. Omar Hassan", status: "complete", hasComment: true },
  ],
  p7: [
    { id: "r1", name: "Dr. Emily Watson", status: "in_progress", hasComment: false },
    { id: "r5", name: "Dr. Anna Kowalski", status: "pending", hasComment: false },
  ],
};

/* ── Journal issues ── */

export const mockIssues: JournalIssue[] = [
  { id: "iss1", label: "Issue #1", paperCount: 8 },
  { id: "iss2", label: "Issue #2", paperCount: 5 },
];

/* ── Dashboard stats ── */

export const mockDashboardStats = {
  newSubmissions: 14,
  awaitingAssignment: 3,
  underReview: 6,
  acceptedPapers: 3,
  rejectedPapers: 4,
  reviewsPending: 12,
};
