import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "local.db");

function seed() {
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  console.log(`Seeding database at ${dbPath}...`);

  // ── User: Dr. A. Reeves ───────────────────────────────────────────────
  const reeves = db
    .insert(schema.users)
    .values({
      walletAddress: "0x7f3a9c2d4e1ba7f391c2d4e73b8f2a1c",
      did: "did:hedera:0x7f3a9c2d",
      displayName: "Dr. A. Reeves",
      orcidId: "0000-0001-2345-6789",
      roles: ["researcher"],
      researchFields: ["Machine Learning", "Climate Science"],
    })
    .returning()
    .get();

  console.log(`  Created user: ${reeves.displayName} (${reeves.id})`);

  // ── Papers ────────────────────────────────────────────────────────────
  const paperData: {
    title: string;
    status: schema.PaperStatusDb;
    studyType: schema.StudyTypeDb;
    createdAt: string;
  }[] = [
    {
      title:
        "On the Reproducibility of Transformer Architectures in Low-Resource Settings",
      status: "published",
      studyType: "original",
      createdAt: "2025-11-02",
    },
    {
      title: "Causal Inference Methods for Observational Climate Data",
      status: "under_review",
      studyType: "original",
      createdAt: "2025-12-18",
    },
    {
      title: "Adversarial Robustness in Federated Learning Protocols",
      status: "contract_pending",
      studyType: "original",
      createdAt: "2026-01-10",
    },
    {
      title: "Graph Neural Networks for Protein Folding Prediction",
      status: "revision_requested",
      studyType: "original",
      createdAt: "2026-01-22",
    },
    {
      title: "Quantum Error Correction in Noisy Intermediate-Scale Devices",
      status: "draft",
      studyType: "original",
      createdAt: "2026-02-05",
    },
  ];

  const createdPapers = db
    .insert(schema.papers)
    .values(
      paperData.map((p) => ({
        title: p.title,
        status: p.status,
        studyType: p.studyType,
        ownerId: reeves.id,
        createdAt: p.createdAt,
      })),
    )
    .returning()
    .all();

  for (const p of createdPapers) {
    console.log(`  Created paper: "${p.title.slice(0, 50)}..." [${p.status}]`);
  }

  // ── Paper Versions (hashes matching mock data) ────────────────────────
  const hashes = [
    "0x3a9fc2e1",
    "0x7b2df891",
    "0x1e4ca3b7",
    "0x9f0ad5c3",
    "0xb8e27f04",
  ];

  db.insert(schema.paperVersions)
    .values(
      createdPapers.map((p, i) => ({
        paperId: p.id,
        versionNumber: 1,
        paperHash: hashes[i],
      })),
    )
    .run();

  console.log("  Created paper versions with hashes");

  // ── Authorship Contract for Paper 3 (Adversarial Robustness) ──────────
  const paper3 = createdPapers[2];

  const contract = db
    .insert(schema.authorshipContracts)
    .values({
      paperId: paper3.id,
      paperTitle: paper3.title,
      status: "pending_signatures",
      creatorId: reeves.id,
    })
    .returning()
    .get();

  console.log(`  Created contract for "${paper3.title.slice(0, 40)}..."`);

  // ── Contract Contributors ─────────────────────────────────────────────
  db.insert(schema.contractContributors)
    .values([
      {
        contractId: contract.id,
        contributorWallet: "0x7f3a9c2d4e1ba7f391c2d4e73b8f2a1c",
        contributorName: "Dr. A. Reeves",
        contributionPct: 40,
        roleDescription: "Lead author, experimental design",
        status: "signed" as const,
        isCreator: true,
        signedAt: "2026-02-06T14:32:00Z",
      },
      {
        contractId: contract.id,
        contributorWallet: "0x91c2d4e7",
        contributorName: "Dr. J. Kim",
        contributionPct: 30,
        roleDescription: "Statistical analysis",
        status: "pending" as const,
        isCreator: false,
      },
      {
        contractId: contract.id,
        contributorWallet: "0x3b8f2a1c",
        contributorName: "Dr. S. Huang",
        contributionPct: 30,
        roleDescription: "Data collection",
        status: "pending" as const,
        isCreator: false,
      },
    ])
    .run();

  console.log("  Created 3 contributors for the contract");

  console.log("\nSeed completed!");
  sqlite.close();
}

seed();
