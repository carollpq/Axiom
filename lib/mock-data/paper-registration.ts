import type { SignedContract, RegisteredJournal } from "@/types/paper-registration";

export const mockSignedContracts: SignedContract[] = [
  { id: 1, title: "On the Reproducibility of Transformer Architectures in Low-Resource Settings", hash: "0xfa91...2c3d", contributors: "A. Reeves (40%), M. Chen (35%), L. Vasquez (25%)", date: "2025-10-10" },
  { id: 2, title: "Adversarial Robustness in Federated Learning Protocols", hash: "0x1e4c...a3b7", contributors: "A. Reeves (40%), J. Kim (30%), S. Huang (30%)", date: "2026-02-06" },
];

export const mockRegisteredJournals: RegisteredJournal[] = [
  { id: 1, name: "Journal of Computational Research", field: "Computer Science", score: 4.3 },
  { id: 2, name: "Nature Machine Learning", field: "Machine Learning", score: 4.8 },
  { id: 3, name: "IEEE Transactions on Neural Networks", field: "Deep Learning", score: 4.1 },
  { id: 4, name: "ACL Rolling Review", field: "NLP", score: 4.5 },
];

export const STEP_LABELS = ["Paper Details", "Provenance", "Contract", "Register / Submit"];
