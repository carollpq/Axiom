# Architecture Design Document v3
## Axiom — Blockchain-Backed Review Fairness for Academic Publishing

**Version:** 3.0 | **Stack:** Next.js 16 · React 19.2 · Hedera (HCS + HTS + Smart Contracts + Mirror Node + Scheduled Txs) · ethers v6 · Lit Protocol · Vercel
**Date:** February 2026 | **Hackathon:** Hedera Hello Future: Apex

---

## 1. Architecture Overview

Axiom fixes **peer review** — the most broken part of academic publishing. Reviewers have no accountability, no portable reputation, and no incentive to improve. Authors have no recourse against vague or unfair reviews. We give journals tools to make review fairer without changing their business model.

### Design Principles

- **Hash-on-chain, content-off-chain.** No paper content or PII on Hedera — only hashes and metadata.
- **Client-side hashing.** SHA-256 via Web Crypto API in-browser.
- **Journal-friendly.** Zero disruption to revenue models.
- **Reviewer accountability without doxxing.** Reputation is public and portable; identity stays anonymous to authors.
- **Append-only integrity.** On-chain records are immutable.
- **Decentralized access control.** Paper privacy during review enforced by Lit Protocol, not server trust.

---

## 2. Adoption Strategy

Journals join because Axiom: (1) makes them more credible, (2) solves operational pain (finding reliable reviewers, managing timelines), (3) differentiates them ("Axiom-verified"), (4) costs nothing in revenue.

| Stakeholder | Key Problem | Axiom Solution |
|---|---|---|
| **Journals** | Finding good reviewers, slow timelines, quality variance | Cross-journal reputation scores, on-chain deadline enforcement, structured criteria |
| **Researchers** | Months of silence, vague reviews, unfair rejection, no recourse | Real-time updates, per-criterion evaluation, pre-registered criteria, rebuttal phase |
| **Reviewers** | Invisible effort, no recognition, no feedback on reviewing | Portable soulbound reputation, author ratings, post-decision public visibility |

**Adoption flywheel:** Journals join (free) → researchers prefer Axiom-verified journals → more journals join → reputation data grows → better reviewer matching → cycle reinforces.

**Hackathon metric:** Every participant creates a Hedera account (wallet). Addresses judging criterion: "Does the solution lead to more Hedera accounts?"

---

## 3. System Architecture

| Component | Technology | Responsibility |
|---|---|---|
| Frontend | Next.js 16 (App Router), React 19.2 | Pages, wallet integration, client-side hashing, Lit encrypt/decrypt |
| API Layer | Next.js Route Handlers (Vercel) | Business logic, CRUD, Hedera orchestration |
| Database | PostgreSQL (Neon) / Drizzle ORM | Users, papers, contracts, reviews, reputation, badges, submissions (20 tables) |
| File Storage | IPFS via Pinata | Lit-encrypted paper PDFs, datasets |
| Consensus | Hedera HCS | 7 domain topics for immutable audit logs |
| Tokens | Hedera HTS | Soulbound reputation NFTs |
| Smart Contracts | Hedera EVM + ethers v6 | TimelineEnforcer: deadline registration/completion/verification |
| Scheduling | Hedera Scheduled Txs | Atomic multi-party authorship contract anchoring |
| Reads | Hedera Mirror Node | Public NFT queries, reputation verification |
| Encryption | Lit Protocol | Decentralized access control during review phase |
| Wallets | Thirdweb v5 | Authentication, message signing |

```
┌──────────────────────────────────────────────────────────────┐
│                       BROWSER CLIENT                          │
│  Next.js 16 · Thirdweb v5 · Client-side Hashing · Lit SDK   │
└───────┬──────────────────────┬───────────────┬───────────────┘
        │ HTTPS (API Routes)   │ Wallet Signing │ Lit Network
        ▼                      ▼               ▼
┌────────────────────┐  ┌──────────────┐  ┌──────────────────┐
│  NEXT.JS API LAYER │  │    HEDERA     │  │  LIT PROTOCOL    │
│  (Vercel Serverless)│  │   NETWORK    │  │   NETWORK        │
│  Business Logic    │  │  HCS · HTS   │  │  Threshold MPC   │
│  Review Pipeline   │  │  Smart Ctrts │  │  Access Control   │
│  Reputation System │  │  Mirror Node │  │  Encrypt/Decrypt  │
└────────┬───────────┘  └──────────────┘  └──────────────────┘
         ▼
┌──────────────────────────────────────────────────────────────┐
│  PostgreSQL (structured) · IPFS/Pinata (encrypted files)     │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Core Features

### 4.1 Authorship Contracts (FR-1)
Contributors define contribution %, all sign cryptographically (viem `verifyMessage`), anchored on HCS. Fully-signed contracts use Scheduled Transactions. Any modification invalidates all signatures.

### 4.2 Paper Registration (FR-2)
Client-side SHA-256 → Lit encryption → IPFS upload → DB → HCS anchor. Study types: original, negative_result, replication, replication_failed, meta_analysis.

### 4.3 Paper Versioning (FR-3)
Each version links to dataset hash, code commit, environment hash. Version creation works; graph UI not yet built.

### 4.4 Pre-Registered Review Criteria (FR-4) — Cornerstone Feature
Journals publish criteria on HCS before review. Criteria become **immutable**. Reviewers evaluate each criterion (yes/no/partially + comment). System computes `allCriteriaMet`. If met but rejected → editor provides public on-chain justification.

```typescript
interface ReviewCriterion {
    id: string;
    label: string;                    // "Methodology is reproducible"
    evaluationType: 'yes_no_partially' | 'scale_1_5';
    description?: string;
    required: boolean;                // Must be "yes" for criteria-met?
}
```

### 4.5 Reviewer Reputation (FR-5)
Soulbound HTS NFTs minted per review event. Cross-journal, non-transferable. Auto-recomputed scores stored in `reputationScores`. Public verification via `GET /api/reviews/reputation?wallet=` (DB + Mirror Node). See §6.

### 4.10 OpenBadges & LinkedIn Integration (FR-10)
OBv3-compliant (W3C Verifiable Credential) achievement badges issued automatically when reviewers reach milestones. Each badge is served as JSON-LD at `GET /api/badges/[id]` with Hedera HTS/HCS evidence URLs. Reviewers can add badges to their LinkedIn profiles via a zero-API-key deep link (`linkedin.com/profile/add?startTask=CERTIFICATION_NAME`).

**Badge milestones:** first_review (1), five_reviews (5), ten_reviews (10), twentyfive_reviews (25), high_reputation (overall >= 80), timely_reviewer (timeliness >= 90). Issuance triggered automatically after each `recordReputation()` call via `checkAndIssueBadges()`.

**Key files:** `src/features/reviewer/lib/badge-definitions.ts` (definitions + issuance logic), `src/features/reviewer/lib/linkedin.ts` (URL builder), `src/features/reviewer/components/dashboard/badge-card.client.tsx` (UI), `src/app/api/badges/[id]/route.ts` (OBv3 endpoint).

### 4.6 Review Transparency (FR-6)
Anonymized reviews public after final decision. Confidential editor comments never public. Authors rate reviewers via 5-protocol system (actionable feedback, deep engagement, fair/objective, justified recommendation, appropriate expertise) — NO author reference stored.

### 4.7 Rebuttal Phase
Researcher-initiated via `POST /api/submissions/[id]/author-response`. See §8.

### 4.8 Real-Time Notifications
DB-backed with NotificationBell (30s polling). Notifications at every pipeline stage including "Viewed by Editor."

### 4.9 Study Type Tagging
Papers tagged at registration. Recorded on-chain, immutable.

---

## 5. Hedera Integration

### HCS Topics (7 domain-scoped, append-only)

| Topic | Purpose | Message Schema |
|---|---|---|
| `papers` | Creation, registrations, versions | `{type: 'paper_created'|'register', paperId, paperHash?, authorWallet, studyType, timestamp}` |
| `contracts` | Authorship creation, signatures | `{type, contractHash, signerWallet, signatures[], contributionSplits[], timestamp}` |
| `submissions` | Submission events, status transitions | `{type: 'submitted'|'viewed_by_editor'|'reviewers_assigned'|'assignment_accepted'|'assignment_declined'|'status_accepted'|'author_response', submissionId, timestamp}` |
| `criteria` | Review criteria publication | `{type, journalId, submissionId, criteriaHash, criteria[], timestamp}` |
| `reviews` | Review anchoring + author comments | `{type, reviewHash, reviewerWallet, criteriaEvaluations, timestamp}` |
| `decisions` | Accept/reject, rebuttal requests | `{type, decision, justification?, allCriteriaMet, timestamp}` |

Additional events on existing topics: `paper_created` (papers), `viewed_by_editor`, `reviewers_assigned`, `assignment_accepted/declined`, `status_accepted`, `author_response`, `rebuttal_requested` (submissions), `author_comment`.

### HCS Message Flow

```
Client                          API                     Hedera
  │ 1. Compute hash             │                        │
  │ 2. Sign with wallet         │                        │
  │── POST /api/... ──────────►│ 3. Validate + store DB │
  │                             │ 4. HCS message ───────►│
  │                             │◄── Receipt {txId} ─────│
  │◄── { txId, timestamp } ────│ 5. Update DB           │
```

### Identity
Wallet-based via Thirdweb v5. ORCID format-validated only (OAuth planned for v2). Future: `did:hedera`.

---

## 6. HTS Soulbound Reputation

**Token:** `AXIOM_REVIEWER_REPUTATION (AXR)` — NFT, unlimited supply, non-transferable.

### Reputation Events

| Event | When | Impact |
|---|---|---|
| `review_completed` | On-time submission | Positive |
| `review_late` | Past deadline | Negative |
| `editor_rating` | Editor rates quality | Variable |
| `author_rating` | Anonymous 5-protocol rating | Variable |
| `paper_published` | Reviewed paper published | Positive |
| `rebuttal_upheld` | Reviewer was wrong | Negative |
| `rebuttal_overturned` | Reviewer was right | Positive |

### Score Computation

```
Overall = 0.30 × Timeliness + 0.25 × Editor Rating + 0.25 × Author Feedback + 0.20 × Publication Outcome
```

Computed via `upsertReputationScore()` (SQL aggregation). Verifiable via Mirror Node.

### Reviewer Search
Editors filter by: overall score, research field, timeliness, review count, conflict of interest.

### System Contracts (Stretch)
HTS precompiled interface to mint from Solidity — not yet implemented.

---

## 7. Lit Protocol — Review-Phase Access Control

Lit encrypts paper content **during review only**. On publication, content is decrypted and handed to journal's distribution. Axiom does NOT gate published paper access.

| Phase | Who Decrypts | Access |
|---|---|---|
| Private Draft | Author(s) | `wallet IN authorWallets` |
| Under Review | Authors + reviewers + editor | `wallet IN allowedWallets` (reviewers added on assignment) |
| Published | Journal's existing model | Decrypted, no longer Lit-gated |

### Encryption Flow
1. Author uploads PDF, computes SHA-256
2. Creates Lit condition (authors-only for draft)
3. Encrypts PDF client-side with Lit key shares
4. POSTs encrypted blob to `/api/upload/ipfs`
5. On-chain hash = hash of ORIGINAL unencrypted file

### Updating Access
On reviewer assignment: `addReviewersToAccessConditions()` merges wallets, rebuilds conditions, updates `papers.litAccessConditionsJson`. Reviewers decrypt immediately.

---

## 8. Rebuttal Phase

**Purpose:** Authors challenge unfair/factually incorrect reviewer comments before final rejection.

**Key design:** Researcher-initiated (not editor-initiated). Old `open-rebuttal` route returns 410.

### Workflow
```
Reviews complete → status: reviews_completed
  → Researcher views + rates reviews (5-protocol)
  → "Accept Reviews" → editor makes final decision
  → "Request Rebuttal" → status: rebuttal_open (14-day deadline)
      → Author responds per-review (agree/disagree + justification)
      → Rebuttal hashed + HCS anchored
      → Editor resolves (upheld/rejected/partial)
      → Resolution HCS anchored
      → Reputation tokens minted (upheld = negative for reviewer, rejected = positive)
```

### Data Model
```typescript
interface Rebuttal {
    id: string; submissionId: string; authorWallet: string;
    status: 'open' | 'submitted' | 'under_review' | 'resolved';
    deadline: Date; // 14 days
    resolution?: 'upheld' | 'rejected' | 'partial';
}

interface RebuttalResponse {
    reviewId: string; criterionId?: string;
    position: 'agree' | 'disagree';
    justification: string; evidence?: string;
}
```

---

## 9. Timeline Enforcement

| Event | Deadline |
|---|---|
| Assign reviewers | 7d from submission |
| Accept/decline | 3d from assignment |
| Review submission | 21d from acceptance (configurable) |
| Editorial decision | 7d from reviews complete |
| Rebuttal response | 14d from opening |
| Rebuttal resolution | 7d from submission |

**Consequences:** Reviewer late → `review_late` HTS token (negative). Editor late → journal timeline score drops + author notified. Rebuttal expired → closes automatically.

### Smart Contract (TimelineEnforcer.sol)
Deployed to Hedera EVM. Integrated via ethers v6 (`src/shared/lib/hedera/timeline-enforcer.ts`).

```solidity
contract TimelineEnforcer {
    struct Deadline { uint256 dueTimestamp; address responsible; bool completed; }
    mapping(bytes32 => Deadline[]) public deadlines;
    function registerDeadline(bytes32 submissionHash, uint256 dueTimestamp, address responsible) external;
    function markCompleted(bytes32 submissionHash, uint256 index) external;
    function checkDeadline(bytes32 submissionHash, uint256 index) external view returns (bool isOverdue, uint256 dueTimestamp, address responsible);
}
```

- Assignment → `registerDeadline()` in `after()` block
- Review submission → `markCompleted()`
- Cron → `checkDeadline()` cross-verifies (chain = source of truth)

Uses Hashio JSON-RPC (`testnet.hashio.io/api`). Graceful fallback if not configured.

---

## 10. Off-Chain Storage

IPFS via Pinata. Non-public files Lit-encrypted. Referenced by CID.

**Upload flow:** Client SHA-256 → Lit encrypt → POST `/api/upload-ipfs` → pin → store CID + original hash + Lit metadata. On-chain hash = ORIGINAL file.

---

## 11. Database Schema

PostgreSQL (Neon) via Drizzle ORM. 20 tables.

```sql
-- IDENTITY
CREATE TABLE users (
    id UUID PRIMARY KEY, wallet_address TEXT UNIQUE NOT NULL,
    display_name TEXT, institution TEXT, bio TEXT, orcid_id TEXT,
    roles TEXT[] DEFAULT '{}', research_fields TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

-- PAPERS
CREATE TABLE papers (
    id UUID PRIMARY KEY, title TEXT NOT NULL, abstract TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    -- draft → registered → contract_pending → submitted → under_review → rebuttal_open → revision_requested → published
    visibility TEXT NOT NULL DEFAULT 'private', current_version INT DEFAULT 1,
    owner_wallet TEXT NOT NULL REFERENCES users(wallet_address),
    journal_id UUID REFERENCES journals(id), contract_id UUID REFERENCES authorship_contracts(id),
    study_type TEXT DEFAULT 'original',  -- original|negative_result|replication|replication_failed|meta_analysis
    replication_of_hash TEXT, replication_of_doi TEXT, research_fields TEXT[] DEFAULT '{}',
    lit_condition_id TEXT, lit_encrypted_key TEXT,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE paper_versions (
    id UUID PRIMARY KEY, paper_id UUID NOT NULL REFERENCES papers(id),
    version_number INT NOT NULL, paper_hash TEXT NOT NULL,  -- SHA-256 of ORIGINAL
    dataset_hash TEXT, dataset_url TEXT, code_commit_hash TEXT, code_repo_url TEXT,
    environment_hash TEXT, file_storage_key TEXT,  -- IPFS CID
    hedera_tx_id TEXT, hedera_timestamp TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(paper_id, version_number)
);

-- AUTHORSHIP CONTRACTS
CREATE TABLE authorship_contracts (
    id UUID PRIMARY KEY, paper_id UUID REFERENCES papers(id), paper_title TEXT,
    contract_hash TEXT NOT NULL, status TEXT DEFAULT 'pending',  -- pending|partially_signed|fully_signed|superseded
    version INT DEFAULT 1, creator_wallet TEXT NOT NULL REFERENCES users(wallet_address),
    hedera_tx_id TEXT, hedera_timestamp TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contract_contributors (
    id UUID PRIMARY KEY, contract_id UUID NOT NULL REFERENCES authorship_contracts(id),
    contributor_wallet TEXT, contributor_orcid TEXT, contributor_name TEXT,
    contribution_pct DECIMAL(5,2) NOT NULL, role_description TEXT,
    signature TEXT, signature_tx_id TEXT, signed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending', invite_token TEXT UNIQUE,
    invite_expires_at TIMESTAMPTZ, display_order INT NOT NULL
);

-- JOURNALS
CREATE TABLE journals (
    id UUID PRIMARY KEY, name TEXT NOT NULL, issn TEXT,
    editor_wallet TEXT NOT NULL REFERENCES users(wallet_address),
    reputation_score DECIMAL(3,2) DEFAULT 0, timeline_score DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- JOURNAL MANAGEMENT
CREATE TABLE journal_issues (
    id UUID PRIMARY KEY, journal_id UUID NOT NULL REFERENCES journals(id),
    label TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE issue_papers (
    id UUID PRIMARY KEY, issue_id UUID NOT NULL REFERENCES journal_issues(id),
    submission_id UUID NOT NULL REFERENCES submissions(id),
    added_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE journal_reviewers (
    id UUID PRIMARY KEY, journal_id UUID NOT NULL REFERENCES journals(id),
    reviewer_wallet TEXT NOT NULL,
    status TEXT DEFAULT 'pending',  -- pending|accepted|declined
    added_at TIMESTAMPTZ DEFAULT now(), responded_at TIMESTAMPTZ
);

-- SUBMISSIONS & REVIEW PIPELINE
CREATE TABLE submissions (
    id UUID PRIMARY KEY, paper_id UUID NOT NULL REFERENCES papers(id),
    journal_id UUID NOT NULL REFERENCES journals(id),
    version_id UUID NOT NULL REFERENCES paper_versions(id),
    contract_id UUID NOT NULL REFERENCES authorship_contracts(id),
    status TEXT DEFAULT 'submitted',
    -- submitted|viewed_by_editor|criteria_published|reviewers_assigned|under_review|
    -- reviews_completed|rebuttal_open|decision_pending|published|rejected|revision_requested
    author_response_status TEXT, author_response_at TIMESTAMPTZ, author_response_tx_id TEXT,
    criteria_hash TEXT, criteria_tx_id TEXT,
    decision TEXT, decision_justification TEXT, decision_tx_id TEXT,
    all_criteria_met BOOLEAN, review_deadline_days INT DEFAULT 21,
    submitted_at TIMESTAMPTZ DEFAULT now(), decided_at TIMESTAMPTZ
);

CREATE TABLE review_criteria (
    id UUID PRIMARY KEY, submission_id UUID NOT NULL REFERENCES submissions(id),
    criteria_json JSONB NOT NULL, criteria_hash TEXT NOT NULL,
    hedera_tx_id TEXT, published_at TIMESTAMPTZ
);

CREATE TABLE review_assignments (
    id UUID PRIMARY KEY, submission_id UUID NOT NULL REFERENCES submissions(id),
    reviewer_wallet TEXT NOT NULL REFERENCES users(wallet_address),
    status TEXT DEFAULT 'assigned',  -- assigned|accepted|declined|in_progress|submitted|late
    assigned_at TIMESTAMPTZ DEFAULT now(), deadline TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ, submitted_at TIMESTAMPTZ
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY, submission_id UUID NOT NULL REFERENCES submissions(id),
    assignment_id UUID NOT NULL REFERENCES review_assignments(id),
    reviewer_wallet TEXT NOT NULL REFERENCES users(wallet_address),
    review_hash TEXT, criteria_evaluations JSONB,
    strengths TEXT, weaknesses TEXT, questions TEXT,
    confidential_comments TEXT,  -- NEVER on-chain, NEVER public
    recommendation TEXT,  -- accept|minor|major|reject
    hedera_tx_id TEXT, reputation_token_serial INT, submitted_at TIMESTAMPTZ
);

-- REBUTTALS
CREATE TABLE rebuttals (
    id UUID PRIMARY KEY, submission_id UUID NOT NULL REFERENCES submissions(id),
    author_wallet TEXT NOT NULL, status TEXT DEFAULT 'open',  -- open|submitted|under_review|resolved
    deadline TIMESTAMPTZ NOT NULL, rebuttal_hash TEXT, hedera_tx_id TEXT,
    resolution TEXT,  -- upheld|rejected|partial
    editor_notes TEXT, resolved_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rebuttal_responses (
    id UUID PRIMARY KEY, rebuttal_id UUID NOT NULL REFERENCES rebuttals(id),
    review_id UUID NOT NULL REFERENCES reviews(id), criterion_id TEXT,
    position TEXT NOT NULL,  -- agree|disagree
    justification TEXT NOT NULL, evidence TEXT
);

-- REVIEWER RATINGS (anonymous — NO author reference)
CREATE TABLE reviewer_ratings (
    id UUID PRIMARY KEY, review_id UUID NOT NULL REFERENCES reviews(id) UNIQUE,
    actionable_feedback INT NOT NULL CHECK (actionable_feedback BETWEEN 1 AND 5),
    deep_engagement INT NOT NULL CHECK (deep_engagement BETWEEN 1 AND 5),
    fair_objective INT NOT NULL CHECK (fair_objective BETWEEN 1 AND 5),
    justified_recommendation INT NOT NULL CHECK (justified_recommendation BETWEEN 1 AND 5),
    appropriate_expertise INT NOT NULL CHECK (appropriate_expertise BETWEEN 1 AND 5),
    overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    comment TEXT, comment_hash TEXT, rating_hash TEXT, reputation_token_serial TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- REPUTATION (append-only — never update or delete)
CREATE TABLE reputation_events (
    id UUID PRIMARY KEY, user_wallet TEXT NOT NULL REFERENCES users(wallet_address),
    event_type TEXT NOT NULL, score_delta DECIMAL(5,2), details JSONB,
    hts_token_serial INT, hedera_tx_id TEXT, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reputation_scores (
    user_wallet TEXT PRIMARY KEY REFERENCES users(wallet_address),
    overall_score DECIMAL(5,2) DEFAULT 0, timeliness_score DECIMAL(5,2) DEFAULT 0,
    editor_rating_avg DECIMAL(5,2) DEFAULT 0, author_rating_avg DECIMAL(5,2) DEFAULT 0,
    publication_score DECIMAL(5,2) DEFAULT 0, review_count INT DEFAULT 0,
    last_computed_at TIMESTAMPTZ DEFAULT now()
);

-- BADGES (OpenBadges v3 achievement credentials)
CREATE TABLE badges (
    id UUID PRIMARY KEY, user_wallet TEXT NOT NULL REFERENCES users(wallet_address),
    badge_type TEXT NOT NULL,  -- first_review|five_reviews|ten_reviews|twentyfive_reviews|high_reputation|timely_reviewer
    achievement_name TEXT NOT NULL, reputation_event_id UUID REFERENCES reputation_events(id),
    metadata JSONB, issued_at TIMESTAMPTZ DEFAULT now(), created_at TIMESTAMPTZ DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY, user_wallet TEXT NOT NULL, type TEXT NOT NULL,
    title TEXT NOT NULL, body TEXT, link TEXT, is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Key Indexes
```sql
CREATE INDEX idx_papers_owner ON papers(owner_wallet);
CREATE INDEX idx_papers_status ON papers(status);
CREATE INDEX idx_submissions_journal ON submissions(journal_id, status);
CREATE INDEX idx_review_assignments_reviewer ON review_assignments(reviewer_wallet, status);
CREATE INDEX idx_review_assignments_deadline ON review_assignments(deadline) WHERE status != 'submitted';
CREATE INDEX idx_reviews_submission ON reviews(submission_id);
CREATE INDEX idx_reputation_events_wallet ON reputation_events(user_wallet, created_at);
CREATE INDEX idx_notifications_user ON notifications(user_wallet, is_read, created_at);
```

---

## 12. API Design

```
app/api/                              # API routes (most mutations are server actions in features/)
├── badges/[id]/                      GET (OBv3 JSON-LD credential)
├── papers/[id]/content/              GET (PDF content retrieval)
├── reviewer-reputation/              GET (DB score + Mirror Node on-chain data)
├── upload-ipfs/                      POST (Pinata upload)
├── cron-deadlines/                   GET (deadline enforcement, CRON_SECRET-gated)
└── test/                             auth/ seed/ cleanup/ (dev-only, NODE_ENV-gated)

Server actions (features/):           # Mutations via 'use server' actions
├── papers/actions.ts                 create, register, submit
├── submissions/actions.ts            publishCriteria, assignReviewer, acceptAssignment, recordDecision, authorResponse
├── reviews/actions.ts                submitReview, rateReviewer
├── rebuttals/actions.ts              respondToRebuttal, resolveRebuttal
├── contracts/actions.ts              create, sign, resetSignatures
├── notifications/actions.ts          markRead
└── users/actions.ts                  create, update
```

### Key API Contracts

**Get Badge (OBv3)** `GET /api/badges/:id`
```typescript
Response: {
  "@context": ["https://www.w3.org/ns/credentials/v2", "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"],
  type: ["VerifiableCredential", "OpenBadgeCredential"],
  issuer: { name: "Axiom Academic Review", url: "..." },
  credentialSubject: { achievement: { name, description, criteria } },
  evidence: [{ id: "hashscan.io/..." }]  // Hedera HTS/HCS links
}
```

**Publish Criteria** `POST /api/submissions/:id/criteria`
```typescript
Request:  { criteria: Array<{ label, evaluationType, description?, required }> }
Response: { criteriaHash, hederaTxId }
```

**Submit Review** `POST /api/reviews/:id`
```typescript
Request:  { criteriaEvaluations: Array<{ criterionId, rating, comment? }>,
            strengths, weaknesses, questions, confidentialComments?, recommendation, reviewHash }
Response: { hederaTxId, reputationTokenSerial }
```

**Submit Rebuttal** `POST /api/rebuttals/:rebuttalId/respond`
```typescript
Request:  { responses: Array<{ reviewId, criterionId?, position, justification, evidence? }>, rebuttalHash }
Response: { hederaTxId, deadline }
```

**Resolve Rebuttal** `POST /api/rebuttals/:rebuttalId/resolve`
```typescript
Request:  { resolution: 'upheld'|'rejected'|'partial', editorNotes, affectedReviews: Array<{ reviewId, outcome }> }
Response: { hederaTxId, reputationTokensMinted }
```

---

## 13. Authentication

Thirdweb v5 wallet connection → JWT in httpOnly cookies. Wallet address = primary identifier. All API routes derive identity from verified JWT, never from request body.

---

## 14. Data Flow Diagrams

### Full Review Lifecycle

```
Author                  Editor                   Reviewer              Hedera
  │ Submit paper ──────►│                        │                     │
  │                     │── HCS submission ─────────────────────────►│
  │                     │ Publish criteria       │                     │
  │                     │── HCS criteria ───────────────────────────►│
  │                     │ Assign reviewers       │                     │
  │                     │──────────────────────►│                     │
  │◄─ Notified ────────│                        │                     │
  │                     │                  Review + evaluate criteria  │
  │                     │              ◄── Submit review               │
  │                     │                        │── HCS + HTS mint ─►│
  │◄─ "Review done" ───│                        │                     │
  │                     │                        │                     │
  │ Accept / Rebuttal ─►│                        │                     │
  │                     │── HCS decision ───────────────────────────►│
  │◄─ Final decision ──│                        │                     │
```

### Paper Registration

```
Author                  Lit Network       API            Hedera      IPFS
  │ hashFile(pdf)       │                 │               │           │
  │ Create condition ──►│                 │               │           │
  │◄── key shares ──────│                 │               │           │
  │ Encrypt client-side │                 │               │           │
  │── POST /upload-ipfs ─────────────────►│── pin ────────┼──────────►│
  │◄── { cid } ─────────────────────────│               │           │
  │── POST /api/papers ─────────────────►│── HCS msg ──►│           │
  │◄── { paperId, txId } ───────────────│               │           │
```

---

## 15. Deployment

Vercel: Next.js 16, Node.js runtime (NOT Edge). Cron jobs for deadline enforcement (every 6 hours). All env vars in Vercel project settings.

---

## 16. Security

| Threat | Mitigation |
|---|---|
| Paper content leak | Lit-encrypted on IPFS, wallet-gated |
| Wallet impersonation | Thirdweb verification, JWT from verified wallet |
| Hash tampering | Client-side hashing, on-chain = source of truth |
| Contract modification after signing | Invalidates all signatures, previous versions on-chain |
| Reviewer identity exposure | Wallet-linked only, author ratings have no rater ID |
| Criteria changed post-publication | HCS immutable, hash verified |
| Rebuttal manipulation | Hashed + HCS anchored before editor review |
| Reputation gaming | Soulbound (non-transferable), append-only |

---

## 17. Future Roadmap

**Phase 2:** Full ORCID OAuth, `did:hedera`, Sybil-resistant reviewer identity
**Phase 3:** x402 micropayment paper access ($0.50-$2/paper), automatic revenue splitting (70% authors, 15% reviewers, 10% journal, 5% platform), funder escrow for open access
**Phase 4:** AI review detection, fraud insurance markets, commercial IP tagging, post-publication commentary

---

## 18. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Lit + Hedera compatibility | Core feature blocked | Fallback: server-side access control |
| HTS minting costs at scale | Budget overrun | ~$0.05/mint, budget for 1000 during hackathon |
| Rebuttal abuse | Authors rebut everything | Editor has final authority |
| Journal reluctance on criteria | Adoption blocked | Start with progressive journals, criteria can be broad |

---

## Appendix: Hedera Service Summary

| Service | Usage | Status |
|---|---|---|
| **HCS** | 7 domain topics, immutable audit logs | Done |
| **HTS** | Soulbound reputation NFTs | Done |
| **Smart Contracts** | TimelineEnforcer (deadline reg/completion/verify) | Done |
| **Mirror Node** | NFT queries, reputation verification | Done |
| **Scheduled Transactions** | Atomic authorship contract anchoring | Done |
| **System Contracts** | HTS mint from Solidity | Stretch |
| **DID** | Wallet-based identity | Done |

| **OpenBadges** | OBv3 verifiable credentials with Hedera evidence | Done |

**All core MVP features implemented.** Remaining stretch: HTS via System Contracts, full ORCID OAuth.
