import type { PaperUnderReview, ReviewCriterion } from "@/src/shared/types/review-workspace";

export const mockPaper: PaperUnderReview = {
  id: 2,
  title: "Distributed Consensus in Heterogeneous IoT Networks",
  abstract:
    "We propose a novel consensus protocol for heterogeneous IoT environments that achieves Byzantine fault tolerance with O(n log n) message complexity. Our approach leverages device capability tiers to dynamically adjust quorum requirements, reducing latency by 47% compared to PBFT while maintaining equivalent safety guarantees. We validate our protocol across three real-world IoT testbeds comprising 1,200+ devices with heterogeneous compute and network profiles.",
  journal: "IEEE Transactions on Distributed Systems",
  version: "v2.1",
  anonymized: true,
  pdfUrl: "#",
  provenance: [
    {
      label: "Paper Hash",
      hash: "b7d4a1e8f3c26095d8e2a4b7c1f3e5d9a8b2c4e6f0a1d3b5c7e9f1a3b5d7e9f1",
      verified: true,
    },
    {
      label: "Dataset",
      hash: "c8e5b2f9a4d37106e9f3b5c8d2a4f6e0b9c3d5f7a1b2e4d6c8f0a2b4d6e8f0a2",
      url: "https://zenodo.org/record/example",
      verified: true,
    },
    {
      label: "Code Repository",
      hash: "d9f6c3a0b5e48217f0a4c6d9e3b5a7f1c0d4e6a8b2c3f5d7a9b1c3e5f7a9b1c3",
      url: "https://github.com/anon/iot-consensus",
      verified: true,
    },
    {
      label: "Environment Spec",
      hash: "e0a7d4b1c6f59328a1b5d7e0f4c6b8a2d1e5f7b9c3d4a6e8f0b2d4c6a8e0b2d4",
      verified: false,
    },
  ],
};

export const mockCriteria: ReviewCriterion[] = [
  {
    id: 1,
    text: "Methodology is reproducible",
    onChainHash: "0x3a1f8b2c9d4e5f60a7b8c9d0e1f2a3b4c5d6e7f8",
  },
  {
    id: 2,
    text: "Statistical analysis is appropriate",
    onChainHash: "0x4b2a9c3d0e5f6a71b8c9d0e1f2a3b4c5d6e7f8a9",
  },
  {
    id: 3,
    text: "Dataset is accessible and described",
    onChainHash: "0x5c3b0d4e1f6a7b82c9d0e1f2a3b4c5d6e7f8a9b0",
  },
  {
    id: 4,
    text: "Claims are supported by evidence",
    onChainHash: "0x6d4c1e5f2a7b8c93d0e1f2a3b4c5d6e7f8a9b0c1",
  },
];
