/**
 * Seed script for NeonDB (PostgreSQL).
 * Run with: npm run db:seed
 *
 * Populates all tables with realistic data covering:
 *  - 1 researcher (Dr. A. Reeves)
 *  - 1 editor (Dr. Sarah Chen) + journal
 *  - 6 reviewers with reputation scores
 *  - 9 papers across all statuses
 *  - Submissions at every pipeline stage
 *  - Review criteria, assignments, and completed reviews
 *  - Reputation events + aggregate scores
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql, schema });

// ── Wallet constants ─────────────────────────────────────────────────────────
const W_RESEARCHER = "0x7f3a9c2d4e1ba7f391c2d4e73b8f2a1c";
const W_EDITOR = "0xed1t0r5ar4hch3n0000000000000000";
const W_R1 = "0xrev1em1lyw4ts0n00000000000000000"; // Dr. Emily Watson
const W_R2 = "0xrev2j4m3sl1u000000000000000000000"; // Dr. James Liu
const W_R3 = "0xrev3pr1y4m3ht4000000000000000000"; // Dr. Priya Mehta
const W_R4 = "0xrev4c4rl0sr1v3r4000000000000000"; // Dr. Carlos Rivera
const W_R5 = "0xrev5ann4k0w4lsk10000000000000000"; // Dr. Anna Kowalski
const W_R6 = "0xrev6om4rh4ss4n000000000000000000"; // Dr. Omar Hassan

// ── Helper ───────────────────────────────────────────────────────────────────
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("Seeding NeonDB...\n");

  // ── Truncate (reverse FK order) ──────────────────────────────────────────
  console.log("Clearing existing data...");
  await db.delete(schema.reputationScores);
  await db.delete(schema.reputationEvents);
  await db.delete(schema.reviews);
  await db.delete(schema.reviewAssignments);
  await db.delete(schema.reviewCriteria);
  await db.delete(schema.submissions);
  await db.delete(schema.contractContributors);
  await db.delete(schema.authorshipContracts);
  await db.delete(schema.paperVersions);
  await db.delete(schema.papers);
  await db.delete(schema.journals);
  await db.delete(schema.users);
  console.log("  Done.\n");

  // ── Users ────────────────────────────────────────────────────────────────
  console.log("Creating users...");

  const [researcher] = await db
    .insert(schema.users)
    .values({
      walletAddress: W_RESEARCHER,
      did: "did:hedera:0x7f3a9c2d",
      displayName: "Dr. A. Reeves",
      institution: "MIT",
      orcidId: "0000-0001-2345-6789",
      roles: ["researcher"],
      researchFields: ["Machine Learning", "Climate Science"],
    })
    .returning();
  console.log(`  Researcher: ${researcher.displayName} (${researcher.id})`);

  const [editor] = await db
    .insert(schema.users)
    .values({
      walletAddress: W_EDITOR,
      did: "did:hedera:0xed1t0r",
      displayName: "Dr. Sarah Chen",
      institution: "Stanford University",
      orcidId: "0000-0009-8765-4321",
      roles: ["editor"],
      researchFields: ["Computational Research", "Machine Learning"],
    })
    .returning();
  console.log(`  Editor:     ${editor.displayName} (${editor.id})`);

  const reviewerData = [
    { wallet: W_R1, name: "Dr. Emily Watson", institution: "Oxford", fields: ["Machine Learning"], orcid: "0000-0001-2345-6789" },
    { wallet: W_R2, name: "Dr. James Liu", institution: "Caltech", fields: ["Quantum Computing"], orcid: "0000-0002-3456-7890" },
    { wallet: W_R3, name: "Dr. Priya Mehta", institution: "Carnegie Mellon", fields: ["NLP", "Machine Learning"], orcid: "0000-0003-4567-8901" },
    { wallet: W_R4, name: "Dr. Carlos Rivera", institution: "ETH Zürich", fields: ["Computer Vision"], orcid: "0000-0004-5678-9012" },
    { wallet: W_R5, name: "Dr. Anna Kowalski", institution: "Cambridge", fields: ["Statistics", "Bayesian Methods"], orcid: "0000-0005-6789-0123" },
    { wallet: W_R6, name: "Dr. Omar Hassan", institution: "UC Berkeley", fields: ["Distributed Systems"], orcid: "0000-0006-7890-1234" },
  ];

  const createdReviewers = await db
    .insert(schema.users)
    .values(
      reviewerData.map((r) => ({
        walletAddress: r.wallet,
        did: `did:hedera:${r.wallet.slice(0, 12)}`,
        displayName: r.name,
        institution: r.institution,
        orcidId: r.orcid,
        roles: ["reviewer"],
        researchFields: r.fields,
      })),
    )
    .returning();
  for (const r of createdReviewers) {
    console.log(`  Reviewer:   ${r.displayName}`);
  }

  // ── Journal ──────────────────────────────────────────────────────────────
  console.log("\nCreating journal...");
  const [journal] = await db
    .insert(schema.journals)
    .values({
      name: "Journal of Computational Research",
      editorWallet: W_EDITOR,
      reputationScore: "4.3",
    })
    .returning();
  console.log(`  ${journal.name} (${journal.id})`);

  // ── Papers ───────────────────────────────────────────────────────────────
  console.log("\nCreating papers...");

  type PaperRow = {
    title: string;
    abstract: string;
    status: schema.PaperStatusDb;
    studyType: schema.StudyTypeDb;
    createdAt: string;
  };

  const paperRows: PaperRow[] = [
    // ── Editor "Incoming" (submitted, awaiting criteria) ──
    {
      title: "Quantum Error Correction Using Topological Codes in Noisy Environments",
      abstract:
        "We present a novel approach to quantum error correction leveraging topological codes that demonstrate improved resilience to noise in intermediate-scale quantum devices.",
      status: "submitted",
      studyType: "original",

      createdAt: daysAgo(9),
    },
    {
      title: "Federated Learning for Privacy-Preserving Medical Image Analysis",
      abstract:
        "This study introduces a federated learning framework enabling collaborative training of medical imaging models across hospital networks without sharing patient data.",
      status: "submitted",
      studyType: "original",

      createdAt: daysAgo(11),
    },
    {
      title: "Scalable Graph Neural Networks for Molecular Property Prediction",
      abstract:
        "We propose a scalable architecture for graph neural networks that achieves state-of-the-art accuracy in molecular property prediction while reducing computational cost.",
      status: "submitted",
      studyType: "original",

      createdAt: daysAgo(14),
    },
    {
      title: "Causal Inference in High-Dimensional Observational Studies",
      abstract:
        "This paper develops new methods for causal inference when the number of potential confounders exceeds the sample size, with applications to genomics and economics.",
      status: "submitted",
      studyType: "original",

      createdAt: daysAgo(17),
    },

    // ── Editor "Under Review" ──
    {
      title: "Transformer Architectures for Long-Range Sequence Modeling",
      abstract:
        "We evaluate extensions to the standard transformer architecture that improve modeling of sequences exceeding 100k tokens while maintaining linear memory complexity.",
      status: "under_review",
      studyType: "original",

      createdAt: daysAgo(32),
    },
    {
      title: "Adversarial Robustness in Multi-Modal Foundation Models",
      abstract:
        "This work investigates vulnerabilities of multi-modal foundation models to adversarial attacks that exploit cross-modal interactions between vision and language.",
      status: "under_review",
      studyType: "original",

      createdAt: daysAgo(38),
    },
    {
      title: "Bayesian Optimization for Automated Hyperparameter Tuning at Scale",
      abstract:
        "We present a distributed Bayesian optimization framework that efficiently tunes hyperparameters across thousands of parallel training jobs on commodity hardware.",
      status: "under_review",
      studyType: "original",

      createdAt: daysAgo(44),
    },

    // ── Editor "Accepted" ──
    {
      title: "Neural Architecture Search with Hardware-Aware Constraints",
      abstract:
        "This paper presents a hardware-aware neural architecture search method that co-optimizes model accuracy and inference latency on edge devices.",
      status: "published",
      studyType: "original",

      createdAt: daysAgo(80),
    },
    {
      title: "Self-Supervised Learning for Low-Resource Language Understanding",
      abstract:
        "We introduce a self-supervised pre-training strategy for low-resource languages that leverages cross-lingual transfer from high-resource language models.",
      status: "published",
      studyType: "original",

      createdAt: daysAgo(85),
    },

    // ── Researcher's own papers ──
    {
      title: "On the Reproducibility of Transformer Architectures in Low-Resource Settings",
      abstract:
        "A systematic reproducibility study examining 12 transformer-based architectures across 8 low-resource language settings.",
      status: "published",
      studyType: "replication",

      createdAt: daysAgo(120),
    },
    {
      title: "Causal Inference Methods for Observational Climate Data",
      abstract:
        "We apply modern causal inference techniques to long-running observational climate datasets to distinguish signal from confounding.",
      status: "under_review",
      studyType: "original",

      createdAt: daysAgo(43),
    },
    {
      title: "Adversarial Robustness in Federated Learning Protocols",
      abstract:
        "An analysis of adversarial attack surfaces unique to federated learning settings, including model poisoning and gradient inversion.",
      status: "contract_pending",
      studyType: "original",

      createdAt: daysAgo(50),
    },
  ];

  const createdPapers = await db
    .insert(schema.papers)
    .values(
      paperRows.map((p) => ({
        ...p,
        ownerId: researcher.id,
      })),
    )
    .returning();

  for (const p of createdPapers) {
    console.log(`  [${p.status.padEnd(18)}] "${p.title.slice(0, 60)}..."`);
  }

  // ── Paper Versions ───────────────────────────────────────────────────────
  console.log("\nCreating paper versions...");
  const sampleHashes = [
    "0x3a9fc2e1d847b305f12c9a7e",
    "0x7b2df8910c3e4a56d89f1b20",
    "0x1e4ca3b72f905d18e4a6c39b",
    "0x9f0ad5c34b127e890d3f56a1",
    "0xb8e27f04c931d5a720e8b4f6",
    "0xd4c61a0392bf74e518a930d7",
    "0xf2e83b4701d9c56a23e4f019",
    "0xa1f94d280bc67e3195d20f84",
    "0xc7b30e5169ad4f2807e15c93",
    "0xe5a12f7843c90b6d2f17e408",
    "0x82d7c3e90f14b5a6d3c28e71",
    "0x6f4ab1c57e20d839f4b61a95",
  ];

  await db.insert(schema.paperVersions).values(
    createdPapers.map((p, i) => ({
      paperId: p.id,
      versionNumber: 1,
      paperHash: sampleHashes[i % sampleHashes.length],
    })),
  );
  console.log(`  Created ${createdPapers.length} versions.`);

  // ── Authorship Contract (researcher's contract_pending paper) ────────────
  console.log("\nCreating authorship contract...");
  const contractPaper = createdPapers.find((p) => p.status === "contract_pending")!;
  const [contract] = await db
    .insert(schema.authorshipContracts)
    .values({
      paperId: contractPaper.id,
      paperTitle: contractPaper.title,
      status: "pending_signatures",
      creatorId: researcher.id,
    })
    .returning();

  await db.insert(schema.contractContributors).values([
    {
      contractId: contract.id,
      contributorWallet: W_RESEARCHER,
      contributorName: "Dr. A. Reeves",
      contributionPct: 40,
      roleDescription: "Lead author, experimental design",
      status: "signed",
      isCreator: true,
      signedAt: daysAgo(48),
    },
    {
      contractId: contract.id,
      contributorWallet: "0x91c2d4e7",
      contributorName: "Dr. J. Kim",
      contributionPct: 30,
      roleDescription: "Statistical analysis",
      status: "pending",
      isCreator: false,
    },
    {
      contractId: contract.id,
      contributorWallet: "0x3b8f2a1c",
      contributorName: "Dr. S. Huang",
      contributionPct: 30,
      roleDescription: "Data collection",
      status: "pending",
      isCreator: false,
    },
  ]);
  console.log(`  Contract for "${contractPaper.title.slice(0, 50)}..." with 3 contributors.`);

  // ── Submissions ──────────────────────────────────────────────────────────
  console.log("\nCreating submissions...");

  // Helper: get paper by title fragment
  const byTitle = (fragment: string) =>
    createdPapers.find((p) => p.title.includes(fragment))!;

  // Incoming papers (status: submitted)
  await db.insert(schema.submissions).values({
    paperId: byTitle("Quantum Error Correction Using Topological").id,
    journalId: journal.id,
    status: "submitted",
    submittedAt: daysAgo(9),
  });

  await db.insert(schema.submissions).values({
    paperId: byTitle("Federated Learning for Privacy").id,
    journalId: journal.id,
    status: "submitted",
    submittedAt: daysAgo(11),
  });

  const subIncoming3 = await db
    .insert(schema.submissions)
    .values({
      paperId: byTitle("Scalable Graph Neural Networks").id,
      journalId: journal.id,
      status: "submitted",
      submittedAt: daysAgo(14),
    })
    .returning()
    .then((r) => r[0]);

  await db.insert(schema.submissions).values({
    paperId: byTitle("Causal Inference in High-Dimensional").id,
    journalId: journal.id,
    status: "submitted",
    submittedAt: daysAgo(17),
  });

  console.log(`  4 incoming submissions (status: submitted).`);

  // ── Criteria for one incoming paper (criteria_published stage) ───────────
  const criteriaJsonP3 = JSON.stringify([
    { id: "c1", label: "Methodology is reproducible", evaluationType: "yes_no_partially", required: true },
    { id: "c2", label: "Statistical analysis is appropriate", evaluationType: "yes_no_partially", required: true },
    { id: "c3", label: "Results support claims", evaluationType: "yes_no_partially", required: true },
    { id: "c4", label: "Related work is adequately cited", evaluationType: "yes_no_partially", required: false },
    { id: "c5", label: "Figures and tables are clear", evaluationType: "yes_no_partially", required: false },
  ]);

  await db
    .update(schema.submissions)
    .set({ status: "criteria_published" })
    .where(eq(schema.submissions.id, subIncoming3.id));

  await db.insert(schema.reviewCriteria).values({
    submissionId: subIncoming3.id,
    criteriaJson: criteriaJsonP3,
    criteriaHash: "0xc4f9e3a17b25d0c8f1e4b63a7d92e105",
    publishedAt: daysAgo(3),
  });

  console.log(`  Criteria published for "Scalable Graph Neural Networks..."`);

  // Under-review submissions (3 papers with full reviewer assignments)
  const criteriaJsonStd = JSON.stringify([
    { id: "c1", label: "Novelty and significance of contribution", evaluationType: "yes_no_partially", required: true },
    { id: "c2", label: "Technical soundness and correctness", evaluationType: "yes_no_partially", required: true },
    { id: "c3", label: "Clarity of presentation", evaluationType: "yes_no_partially", required: false },
    { id: "c4", label: "Reproducibility: code/data provided or described", evaluationType: "yes_no_partially", required: false },
    { id: "c5", label: "Adequate comparison to prior work", evaluationType: "yes_no_partially", required: true },
  ]);
  const criteriaHashStd = "0xa8d2f1c9e07b3456a19c8f07e23d4b56";

  // Sub: Transformer Architectures (p5 — reviewers: r1 complete, r3 in_progress, r5 complete)
  const [subP5] = await db
    .insert(schema.submissions)
    .values({
      paperId: byTitle("Transformer Architectures for Long-Range").id,
      journalId: journal.id,
      status: "under_review",
      reviewerWallets: [W_R1, W_R3, W_R5],
      reviewDeadline: daysFromNow(8),
      criteriaHash: criteriaHashStd,
      submittedAt: daysAgo(32),
    })
    .returning();

  await db.insert(schema.reviewCriteria).values({
    submissionId: subP5.id,
    criteriaJson: criteriaJsonStd,
    criteriaHash: criteriaHashStd,
    publishedAt: daysAgo(25),
  });

  // Sub: Adversarial Robustness (p6 — reviewers: r2 declined, r4 in_progress, r6 complete)
  const [subP6] = await db
    .insert(schema.submissions)
    .values({
      paperId: byTitle("Adversarial Robustness in Multi-Modal").id,
      journalId: journal.id,
      status: "under_review",
      reviewerWallets: [W_R2, W_R4, W_R6],
      reviewDeadline: daysFromNow(5),
      criteriaHash: criteriaHashStd,
      submittedAt: daysAgo(38),
    })
    .returning();

  await db.insert(schema.reviewCriteria).values({
    submissionId: subP6.id,
    criteriaJson: criteriaJsonStd,
    criteriaHash: criteriaHashStd,
    publishedAt: daysAgo(31),
  });

  // Sub: Bayesian Optimization (p7 — reviewers: r1 in_progress, r5 pending)
  const [subP7] = await db
    .insert(schema.submissions)
    .values({
      paperId: byTitle("Bayesian Optimization for Automated").id,
      journalId: journal.id,
      status: "under_review",
      reviewerWallets: [W_R1, W_R5],
      reviewDeadline: daysFromNow(12),
      criteriaHash: criteriaHashStd,
      submittedAt: daysAgo(44),
    })
    .returning();

  await db.insert(schema.reviewCriteria).values({
    submissionId: subP7.id,
    criteriaJson: criteriaJsonStd,
    criteriaHash: criteriaHashStd,
    publishedAt: daysAgo(37),
  });

  console.log(`  3 under-review submissions with criteria.`);

  // Accepted / published submissions
  const [subP8] = await db
    .insert(schema.submissions)
    .values({
      paperId: byTitle("Neural Architecture Search with Hardware").id,
      journalId: journal.id,
      status: "accepted",
      reviewerWallets: [W_R3, W_R4],
      criteriaHash: criteriaHashStd,
      criteriaMet: true,
      decision: "accept",
      submittedAt: daysAgo(80),
      decidedAt: daysAgo(20),
    })
    .returning();

  const [subP9] = await db
    .insert(schema.submissions)
    .values({
      paperId: byTitle("Self-Supervised Learning for Low-Resource").id,
      journalId: journal.id,
      status: "accepted",
      reviewerWallets: [W_R5, W_R6],
      criteriaHash: criteriaHashStd,
      criteriaMet: true,
      decision: "accept",
      submittedAt: daysAgo(85),
      decidedAt: daysAgo(25),
    })
    .returning();

  console.log(`  2 accepted submissions.`);

  // Researcher's own submitted paper (so it shows up on their dashboard)
  await db.insert(schema.submissions).values({
    paperId: byTitle("Causal Inference Methods for Observational Climate").id,
    journalId: journal.id,
    status: "under_review",
    reviewerWallets: [W_R2, W_R3],
    reviewDeadline: daysFromNow(10),
    criteriaHash: criteriaHashStd,
    submittedAt: daysAgo(43),
  });

  // ── Review Assignments ───────────────────────────────────────────────────
  console.log("\nCreating review assignments...");

  // p5 — Transformer Architectures
  const [asgP5R1] = await db
    .insert(schema.reviewAssignments)
    .values({
      submissionId: subP5.id,
      reviewerWallet: W_R1,
      status: "submitted",
      assignedAt: daysAgo(25),
      deadline: daysFromNow(8),
      acceptedAt: daysAgo(23),
      submittedAt: daysAgo(5),
    })
    .returning();

  await db.insert(schema.reviewAssignments).values({
    submissionId: subP5.id,
    reviewerWallet: W_R3,
    status: "accepted",
    assignedAt: daysAgo(25),
    deadline: daysFromNow(8),
    acceptedAt: daysAgo(22),
  });

  const [asgP5R5] = await db
    .insert(schema.reviewAssignments)
    .values({
      submissionId: subP5.id,
      reviewerWallet: W_R5,
      status: "submitted",
      assignedAt: daysAgo(25),
      deadline: daysFromNow(8),
      acceptedAt: daysAgo(24),
      submittedAt: daysAgo(3),
    })
    .returning();

  // p6 — Adversarial Robustness
  await db.insert(schema.reviewAssignments).values({
    submissionId: subP6.id,
    reviewerWallet: W_R2,
    status: "declined",
    assignedAt: daysAgo(31),
    deadline: daysFromNow(5),
  });

  await db.insert(schema.reviewAssignments).values({
    submissionId: subP6.id,
    reviewerWallet: W_R4,
    status: "accepted",
    assignedAt: daysAgo(28),
    deadline: daysFromNow(5),
    acceptedAt: daysAgo(26),
  });

  const [asgP6R6] = await db
    .insert(schema.reviewAssignments)
    .values({
      submissionId: subP6.id,
      reviewerWallet: W_R6,
      status: "submitted",
      assignedAt: daysAgo(28),
      deadline: daysFromNow(5),
      acceptedAt: daysAgo(27),
      submittedAt: daysAgo(4),
    })
    .returning();

  // p7 — Bayesian Optimization
  await db.insert(schema.reviewAssignments).values({
    submissionId: subP7.id,
    reviewerWallet: W_R1,
    status: "accepted",
    assignedAt: daysAgo(37),
    deadline: daysFromNow(12),
    acceptedAt: daysAgo(35),
  });

  await db.insert(schema.reviewAssignments).values({
    submissionId: subP7.id,
    reviewerWallet: W_R5,
    status: "assigned",
    assignedAt: daysAgo(20),
    deadline: daysFromNow(12),
  });

  // p8 / p9 — completed assignments
  const [asgP8R3] = await db
    .insert(schema.reviewAssignments)
    .values({
      submissionId: subP8.id,
      reviewerWallet: W_R3,
      status: "submitted",
      assignedAt: daysAgo(70),
      deadline: daysAgo(35),
      acceptedAt: daysAgo(68),
      submittedAt: daysAgo(40),
    })
    .returning();

  const [asgP8R4] = await db
    .insert(schema.reviewAssignments)
    .values({
      submissionId: subP8.id,
      reviewerWallet: W_R4,
      status: "submitted",
      assignedAt: daysAgo(70),
      deadline: daysAgo(35),
      acceptedAt: daysAgo(69),
      submittedAt: daysAgo(38),
    })
    .returning();

  const [asgP9R5] = await db
    .insert(schema.reviewAssignments)
    .values({
      submissionId: subP9.id,
      reviewerWallet: W_R5,
      status: "submitted",
      assignedAt: daysAgo(75),
      deadline: daysAgo(40),
      acceptedAt: daysAgo(74),
      submittedAt: daysAgo(45),
    })
    .returning();

  const [asgP9R6] = await db
    .insert(schema.reviewAssignments)
    .values({
      submissionId: subP9.id,
      reviewerWallet: W_R6,
      status: "submitted",
      assignedAt: daysAgo(75),
      deadline: daysAgo(40),
      acceptedAt: daysAgo(73),
      submittedAt: daysAgo(44),
    })
    .returning();

  console.log(`  Created ${10 + 2} review assignments.`);

  // ── Reviews (completed ones) ─────────────────────────────────────────────
  console.log("\nCreating reviews...");

  const evalMet = JSON.stringify([
    { criterionId: "c1", evaluation: "yes", comment: "Methodology is clearly described and reproducible." },
    { criterionId: "c2", evaluation: "yes", comment: "Statistical approach is sound and well-justified." },
    { criterionId: "c3", evaluation: "yes", comment: "Claims are well-supported by experimental results." },
    { criterionId: "c4", evaluation: "partially", comment: "A few key recent papers are missing from the literature review." },
    { criterionId: "c5", evaluation: "yes", comment: "Figures are clear and informative." },
  ]);

  // p5: r1 complete
  await db.insert(schema.reviews).values({
    submissionId: subP5.id,
    assignmentId: asgP5R1.id,
    reviewerWallet: W_R1,
    reviewHash: "0xrev1p5hash001",
    criteriaEvaluations: evalMet,
    strengths: "Strong experimental validation across multiple datasets. Clear writing.",
    weaknesses: "Missing comparison to two recent SOTA methods (2025).",
    questionsForAuthors: "How does the approach scale beyond 256k tokens?",
    recommendation: "minor_revision",
    submittedAt: daysAgo(5),
  });

  // p5: r5 complete
  await db.insert(schema.reviews).values({
    submissionId: subP5.id,
    assignmentId: asgP5R5.id,
    reviewerWallet: W_R5,
    reviewHash: "0xrev5p5hash001",
    criteriaEvaluations: evalMet,
    strengths: "Rigorous statistical methodology. Well-motivated problem.",
    weaknesses: "Section 4.2 requires more detail on the variance reduction technique.",
    questionsForAuthors: "Can you provide ablation results without the positional encoding change?",
    recommendation: "accept",
    submittedAt: daysAgo(3),
  });

  // p6: r6 complete
  const evalPartialMet = JSON.stringify([
    { criterionId: "c1", evaluation: "yes", comment: "Novel attack vector, clearly significant." },
    { criterionId: "c2", evaluation: "partially", comment: "Some theoretical claims lack formal proofs." },
    { criterionId: "c3", evaluation: "no", comment: "The proposed defense is not compared to recent baselines." },
    { criterionId: "c4", evaluation: "yes", comment: "Code is available." },
    { criterionId: "c5", evaluation: "partially", comment: "Comparison to prior work is incomplete." },
  ]);
  await db.insert(schema.reviews).values({
    submissionId: subP6.id,
    assignmentId: asgP6R6.id,
    reviewerWallet: W_R6,
    reviewHash: "0xrev6p6hash001",
    criteriaEvaluations: evalPartialMet,
    strengths: "Identifies a genuinely novel cross-modal adversarial vulnerability.",
    weaknesses: "Defense evaluation is weak. Theory section needs strengthening.",
    questionsForAuthors: "How do you ensure the attack transfers across modalities not tested?",
    recommendation: "major_revision",
    submittedAt: daysAgo(4),
  });

  // p8 / p9 — accepted paper reviews
  await db.insert(schema.reviews).values([
    {
      submissionId: subP8.id,
      assignmentId: asgP8R3.id,
      reviewerWallet: W_R3,
      reviewHash: "0xrev3p8hash001",
      criteriaEvaluations: evalMet,
      strengths: "Hardware-aware NAS is timely and practical.",
      weaknesses: "Minor: ablation on constraint relaxation would strengthen the paper.",
      recommendation: "accept",
      submittedAt: daysAgo(40),
    },
    {
      submissionId: subP8.id,
      assignmentId: asgP8R4.id,
      reviewerWallet: W_R4,
      reviewHash: "0xrev4p8hash001",
      criteriaEvaluations: evalMet,
      strengths: "Solid evaluation across 4 hardware platforms.",
      weaknesses: "Would benefit from a larger model-size evaluation.",
      recommendation: "accept",
      submittedAt: daysAgo(38),
    },
    {
      submissionId: subP9.id,
      assignmentId: asgP9R5.id,
      reviewerWallet: W_R5,
      reviewHash: "0xrev5p9hash001",
      criteriaEvaluations: evalMet,
      strengths: "Impressive results on 6 low-resource languages.",
      weaknesses: "Some data preprocessing decisions need more justification.",
      recommendation: "accept",
      submittedAt: daysAgo(45),
    },
    {
      submissionId: subP9.id,
      assignmentId: asgP9R6.id,
      reviewerWallet: W_R6,
      reviewHash: "0xrev6p9hash001",
      criteriaEvaluations: evalMet,
      strengths: "Cross-lingual transfer study is well-designed.",
      weaknesses: "Minor writing issues in Section 3.",
      recommendation: "accept",
      submittedAt: daysAgo(44),
    },
  ]);

  console.log(`  Created 7 reviews.`);

  // ── Reputation Events ────────────────────────────────────────────────────
  console.log("\nCreating reputation events...");

  type RepEvent = {
    userWallet: string;
    eventType: schema.ReputationEventTypeDb;
    scoreDelta: number;
    details: string;
  };

  const repEvents: RepEvent[] = [
    // Emily Watson (r1) — 23 reviews, high score
    { userWallet: W_R1, eventType: "review_completed", scoreDelta: 5, details: "On-time review for submission on ML safety" },
    { userWallet: W_R1, eventType: "paper_published", scoreDelta: 3, details: "Reviewed paper accepted to JCR Issue #1" },
    { userWallet: W_R1, eventType: "editor_rating", scoreDelta: 4, details: "Editor rating: 4/5 for thoroughness" },
    { userWallet: W_R1, eventType: "review_completed", scoreDelta: 5, details: "On-time review for NLP paper" },
    // James Liu (r2) — 18 reviews
    { userWallet: W_R2, eventType: "review_completed", scoreDelta: 5, details: "On-time review for quantum circuit paper" },
    { userWallet: W_R2, eventType: "review_late", scoreDelta: -3, details: "Review submitted 4 days late" },
    { userWallet: W_R2, eventType: "editor_rating", scoreDelta: 3, details: "Editor rating: 3/5" },
    // Priya Mehta (r3) — 31 reviews
    { userWallet: W_R3, eventType: "review_completed", scoreDelta: 5, details: "On-time review — NAS paper" },
    { userWallet: W_R3, eventType: "paper_published", scoreDelta: 3, details: "Reviewed paper published" },
    { userWallet: W_R3, eventType: "editor_rating", scoreDelta: 4, details: "Editor rating: 4/5" },
    { userWallet: W_R3, eventType: "review_completed", scoreDelta: 5, details: "On-time review" },
    { userWallet: W_R3, eventType: "author_rating", scoreDelta: 4, details: "Anonymous author rating: 4/5" },
    // Carlos Rivera (r4) — 12 reviews
    { userWallet: W_R4, eventType: "review_completed", scoreDelta: 5, details: "On-time review" },
    { userWallet: W_R4, eventType: "editor_rating", scoreDelta: 2, details: "Editor rating: 2/5" },
    { userWallet: W_R4, eventType: "review_late", scoreDelta: -3, details: "Review submitted late" },
    // Anna Kowalski (r5) — 27 reviews, highest score
    { userWallet: W_R5, eventType: "review_completed", scoreDelta: 5, details: "On-time review" },
    { userWallet: W_R5, eventType: "paper_published", scoreDelta: 3, details: "Reviewed paper published in JCR" },
    { userWallet: W_R5, eventType: "editor_rating", scoreDelta: 5, details: "Editor rating: 5/5 — exceptional quality" },
    { userWallet: W_R5, eventType: "review_completed", scoreDelta: 5, details: "On-time review" },
    { userWallet: W_R5, eventType: "author_rating", scoreDelta: 5, details: "Anonymous author rating: 5/5" },
    { userWallet: W_R5, eventType: "rebuttal_overturned", scoreDelta: 2, details: "Author rebuttal rejected — reviewer was correct" },
    // Omar Hassan (r6) — 15 reviews
    { userWallet: W_R6, eventType: "review_completed", scoreDelta: 5, details: "On-time review" },
    { userWallet: W_R6, eventType: "editor_rating", scoreDelta: 3, details: "Editor rating: 3/5" },
    { userWallet: W_R6, eventType: "paper_published", scoreDelta: 3, details: "Reviewed paper published" },
  ];

  await db.insert(schema.reputationEvents).values(repEvents);
  console.log(`  Created ${repEvents.length} reputation events.`);

  // ── Reputation Scores ────────────────────────────────────────────────────
  console.log("\nCreating reputation scores...");

  await db.insert(schema.reputationScores).values([
    { userWallet: W_R1, overallScore: 47, timelinessScore: 50, editorRatingAvg: 40, authorRatingAvg: 45, publicationScore: 30, reviewCount: 23 },
    { userWallet: W_R2, overallScore: 45, timelinessScore: 38, editorRatingAvg: 30, authorRatingAvg: 40, publicationScore: 25, reviewCount: 18 },
    { userWallet: W_R3, overallScore: 42, timelinessScore: 45, editorRatingAvg: 40, authorRatingAvg: 42, publicationScore: 30, reviewCount: 31 },
    { userWallet: W_R4, overallScore: 39, timelinessScore: 35, editorRatingAvg: 20, authorRatingAvg: 35, publicationScore: 20, reviewCount: 12 },
    { userWallet: W_R5, overallScore: 48, timelinessScore: 50, editorRatingAvg: 50, authorRatingAvg: 50, publicationScore: 35, reviewCount: 27 },
    { userWallet: W_R6, overallScore: 41, timelinessScore: 45, editorRatingAvg: 30, authorRatingAvg: 38, publicationScore: 30, reviewCount: 15 },
  ]);
  console.log(`  Created 6 reviewer reputation scores.`);

  console.log("\n✓ Seed complete!");
  console.log(`
Summary:
  Users:         ${2 + createdReviewers.length} (1 researcher, 1 editor, 6 reviewers)
  Journals:      1
  Papers:        ${createdPapers.length}
  Submissions:   10 (4 incoming, 3 under review, 2 accepted, 1 researcher's)
  Criteria:      4 published
  Assignments:   12
  Reviews:       7
  Rep events:    ${repEvents.length}
  Rep scores:    6
`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
