import type { ExistingDraft, KnownUser, Contributor } from "@/types/contract";

export const CURRENT_USER_WALLET = "0x7f3a...9c2d";

export const mockDrafts: ExistingDraft[] = [
  { id: 1, title: "Adversarial Robustness in Federated Learning Protocols", hash: "0x1e4c...a3b7" },
  { id: 2, title: "Quantum Error Correction in Noisy Intermediate-Scale Devices", hash: "0xb8e2...7f04" },
];

export const mockKnownUsers: KnownUser[] = [
  { did: "did:hedera:0x7f3a9c2d", name: "Dr. A. Reeves", orcid: "0000-0001-2345-6789", wallet: "0x7f3a...9c2d" },
  { did: "did:hedera:0x4e1ba7f3", name: "Dr. K. Tanaka", orcid: "0000-0002-8765-4321", wallet: "0x4e1b...a7f3" },
  { did: "did:hedera:0x91c2d4e7", name: "Dr. J. Kim", orcid: "0000-0003-1234-5678", wallet: "0x91c2...d4e7" },
  { did: "did:hedera:0x3b8f2a1c", name: "Dr. S. Huang", orcid: "0000-0001-9876-5432", wallet: "0x3b8f...2a1c" },
];

export const mockContributors: Contributor[] = [
  { id: 1, wallet: "0x7f3a...9c2d", did: "did:hedera:0x7f3a9c2d", name: "Dr. A. Reeves", orcid: "0000-0001-2345-6789", pct: 40, role: "Lead author, experimental design", status: "signed", txHash: "0xfa91...2c3d", signedAt: "2026-02-06 14:32 UTC", isCreator: true },
  { id: 2, wallet: "0x91c2...d4e7", did: "did:hedera:0x91c2d4e7", name: "Dr. J. Kim", orcid: "0000-0003-1234-5678", pct: 30, role: "Statistical analysis", status: "pending", txHash: null, signedAt: null, isCreator: false },
  { id: 3, wallet: "0x3b8f...2a1c", did: "did:hedera:0x3b8f2a1c", name: "Dr. S. Huang", orcid: "0000-0001-9876-5432", pct: 30, role: "Data collection", status: "pending", txHash: null, signedAt: null, isCreator: false },
];
