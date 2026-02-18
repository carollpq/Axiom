# Architecture Design Document

**Blockchain-Backed Research Publishing & Peer Review Platform**
Version: 1.0 | Stack: Next.js · Hedera · Vercel · HashPack/MetaMask | February 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Layer Breakdown](#3-layer-breakdown)
4. [Hedera Integration Architecture](#4-hedera-integration-architecture)
5. [Off-Chain Storage Recommendation](#5-off-chain-storage-recommendation)
6. [Database Schema Design](#6-database-schema-design)
7. [API Design](#7-api-design)
8. [Authentication & Identity Architecture](#8-authentication--identity-architecture)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Data Flow Diagrams](#10-data-flow-diagrams)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Security Architecture](#12-security-architecture)
13. [Scalability Considerations](#13-scalability-considerations)
14. [Open Questions & Risks](#14-open-questions--risks)

---

## 1. Architecture Overview

### Design Principles

- **Hash-on-chain, content-off-chain.** No paper content, review text, or PII is stored on Hedera. Only cryptographic hashes and metadata references go on-chain. This satisfies NFR-2 (security) and NFR-4 (privacy/GDPR).
- **Client-side hashing.** All SHA-256 hashes (papers, datasets, reviews) are computed in the browser via Web Crypto API before anything leaves the client. This ensures users can verify what gets anchored on-chain (PS-11).
- **Wallet-first authentication.** No passwords or email-based auth. Identity flows through wallet -> DID -> ORCID. The wallet signature is the authentication primitive.
- **Append-only integrity.** On-chain records are immutable by nature. Off-chain records that mirror on-chain state (contracts, reviews, reputations) must also be treated as append-only -- never updated in place, only superseded by new versions.
- **Role-based access, not role-based identity.** A single DID can hold Author, Reviewer, and Editor roles simultaneously. Access control is per-role, not per-account.

### System Boundaries

```
+-----------------------------------------------------------+
|                      BROWSER CLIENT                        |
|  Next.js App · Wallet SDKs · Client-side Hashing          |
+---------------+----------------------+--------------------+
                | HTTPS (API Routes)   | Direct Wallet Signing
                v                      v
+----------------------------+  +-------------------------------+
|   NEXT.JS API LAYER        |  |   HEDERA NETWORK              |
|   (Vercel Serverless)      |  |   HCS · DID · Token Service   |
|                            |  |                               |
|  Business Logic            |<-|   Consensus Timestamps        |
|  Off-chain Orchestration   |  |   Immutable Topic Messages    |
|  Reputation Computation    |  |   DID Document Resolution     |
+------------+---------------+  +-------------------------------+
             |
             v
+-----------------------------------------------------------+
|              OFF-CHAIN DATA LAYER                          |
|  PostgreSQL (structured data) · Object Storage (files)     |
+-----------------------------------------------------------+
```

---

## 2. High-Level System Architecture

### Component Map

| Component | Technology | Responsibility |
|-----------|-----------|----------------|
| Frontend | Next.js 15 (App Router) | 10 pages from PRD, wallet integration, client-side hashing |
| API Layer | Next.js Route Handlers (Vercel) | Business logic, off-chain CRUD, Hedera submission orchestration |
| Database | PostgreSQL (Neon) | Users, papers, contracts, reviews, reputation, notifications |
| File Storage | Cloudflare R2 (S3-compatible) | Paper PDFs, dataset files, environment specs |
| Blockchain | Hedera (HCS + DID) | Immutable anchoring: hashes, signatures, criteria, decisions |
| Identity | Hedera DID SDK + ORCID OAuth 2.0 | Decentralized identity with academic identity bridge |
| Wallets | HashPack SDK + MetaMask (ethers.js/wagmi) | User authentication, transaction signing |
| Background Jobs | Vercel Cron / QStash (Upstash) | Reputation recomputation, deadline monitoring, notifications |
| Cache | Upstash Redis | HCS topic caching, session data, rate limiting |

---

## 3. Layer Breakdown

### 3.1 Presentation Layer (Next.js Frontend)

The frontend is a Next.js App Router application with the following page structure mapping directly to the PRD:

```
app/
├── (public)/
│   ├── page.tsx                       # Page 1: Landing Page
│   └── explore/
│       ├── page.tsx                   # Page 6: Public Explorer (search/browse)
│       └── [paperId]/page.tsx         # Page 6: Paper Detail View
├── (auth)/
│   └── connect/page.tsx               # Page 2: Wallet Connect / Login
├── (dashboard)/
│   ├── layout.tsx                     # Shared dashboard shell (top bar, role switcher, notifications)
│   ├── author/
│   │   ├── page.tsx                   # Page 3: Author Dashboard
│   │   ├── contracts/
│   │   │   ├── new/page.tsx           # Page 4: Authorship Contract Builder
│   │   │   └── [contractId]/page.tsx
│   │   └── papers/
│   │       ├── new/page.tsx           # Page 5: Paper Registration & Submission
│   │       └── [paperId]/page.tsx     # Paper detail (author context)
│   ├── reviewer/
│   │   ├── page.tsx                   # Page 7: Reviewer Dashboard
│   │   └── reviews/
│   │       └── [reviewId]/page.tsx    # Page 8: Review Workspace
│   ├── editor/
│   │   └── page.tsx                   # Page 9: Journal Dashboard
│   └── settings/page.tsx             # Page 10: Profile / Settings
```

**Key frontend patterns:**

- **Wallet Adapter Abstraction.** A unified `WalletProvider` context wrapping both HashPack and MetaMask SDKs behind a common interface (`connect()`, `sign()`, `getAddress()`, `disconnect()`). This insulates all components from wallet-specific APIs.
- **Client-side hashing module.** A `lib/hashing.ts` utility using `SubtleCrypto.digest('SHA-256', ...)` for computing file hashes in the browser before upload.
- **Optimistic UI with on-chain confirmation.** For actions that write to Hedera, show immediate optimistic state in the UI, then confirm once the HCS message receipt returns (typically < 5 seconds per NFR-1).
- **Role-gated routing.** The `(dashboard)/layout.tsx` checks the user's active role from context and restricts navigation accordingly.

### 3.2 API Layer (Next.js Route Handlers)

Deployed as Vercel serverless functions. Organized by domain:

```
app/api/
├── auth/
│   ├── verify-wallet/route.ts        # Verify wallet signature, issue session
│   ├── orcid/callback/route.ts       # ORCID OAuth callback
│   └── session/route.ts              # Session check/refresh
├── users/
│   ├── route.ts                      # Profile CRUD
│   └── [did]/reputation/route.ts     # Public reputation query
├── papers/
│   ├── route.ts                      # List/create papers
│   ├── [paperId]/route.ts            # Paper detail
│   ├── [paperId]/versions/route.ts
│   └── [paperId]/submit/route.ts     # Submit to journal
├── contracts/
│   ├── route.ts                      # List/create authorship contracts
│   ├── [contractId]/route.ts         # Contract detail
│   └── [contractId]/sign/route.ts    # Record signature
├── reviews/
│   ├── route.ts                      # List reviews (for reviewer)
│   ├── [reviewId]/route.ts           # Review detail / submit
│   └── [reviewId]/rate/route.ts      # Author rates reviewer
├── journals/
│   ├── route.ts                      # Journal management
│   ├── [journalId]/submissions/route.ts
│   ├── [journalId]/criteria/route.ts # Publish criteria
│   └── [journalId]/decisions/route.ts# Accept/reject
├── hedera/
│   └── verify/route.ts               # Verify on-chain hash (proxy to mirror node)
└── notifications/
    └── route.ts
```

**API design principles:**

- All mutating endpoints require a valid wallet-signed session token.
- Endpoints that trigger Hedera writes follow a two-phase pattern: (1) validate and store off-chain, (2) submit to HCS, (3) update off-chain record with transaction ID.
- Public endpoints (paper explorer, reputation queries, hash verification) require no auth.

### 3.3 Hedera Integration Layer

Abstracted into a service module:

```
lib/hedera/
├── client.ts              # Hedera SDK client initialization
├── hcs.ts                 # HCS topic management and message submission
├── did.ts                 # DID creation, resolution, document updates
├── topics.ts              # Topic ID registry (which topic for what purpose)
└── verify.ts              # Mirror node queries for verification
```

### 3.4 Off-Chain Data Layer

Covered in [Section 5](#5-off-chain-storage-recommendation) (storage recommendation) and [Section 6](#6-database-schema-design) (database schema).

---

## 4. Hedera Integration Architecture

### 4.1 HCS Topic Strategy

Hedera Consensus Service (HCS) is the primary on-chain primitive. Each topic is an ordered, immutable append-only log. The platform uses **domain-scoped topics**:

| Topic | Purpose | Message Schema |
|-------|---------|---------------|
| `papers` | Draft registrations, version anchoring | `{type: "register"/"newVersion", paperHash, provenanceHashes, authorDid, timestamp}` |
| `contracts` | Authorship contract recording | `{type: "create"/"sign"/"fullySigned", contractHash, signerDid, signature, timestamp}` |
| `submissions` | Paper submissions to journals | `{type: "submit", paperHash, contractHash, journalId, timestamp}` |
| `criteria` | Journal review criteria publication | `{type: "publish", journalId, submissionId, criteriaHash, criteria[], timestamp}` |
| `reviews` | Review hash anchoring | `{type: "submit", reviewHash, reviewerDid, paperHash, criteriaHash, timestamp}` |
| `decisions` | Journal accept/reject decisions | `{type: "accept"/"reject"/"revise", paperHash, journalId, justification?, timestamp}` |
| `retractions` | Retraction records (display in MVP) | `{type: "retract", paperHash, requestingParty, reason, failedComponent, timestamp}` |

**Why domain topics over per-paper topics:** Per-paper topics would create millions of topics over time, making management complex. Domain topics keep the topic count small and predictable. The trade-off is that mirror node queries need to filter by `paperHash` within a topic, but Hedera's mirror node API supports this efficiently.

### 4.2 HCS Message Flow

```
Client (Browser)                    API (Serverless)               Hedera
      |                                   |                           |
      |  1. Compute hash client-side      |                           |
      |  2. Sign hash with wallet         |                           |
      |---- POST /api/papers ------------>|                           |
      |     { paperHash, signature,       |                           |
      |       provenanceHashes, ... }     |                           |
      |                                   |  3. Validate signature    |
      |                                   |  4. Store off-chain       |
      |                                   |  5. Submit HCS message -->|
      |                                   |                           |
      |                                   |<-- 6. Receipt (txId) -----|
      |                                   |  7. Update off-chain      |
      |                                   |     record with txId      |
      |<-- 8. Return { txId, timestamp } -|                           |
```

### 4.3 DID Architecture

Using `did:hedera` method via the Hedera DID SDK:

- **Creation (WC3):** On first wallet connection, generate a DID document registered on Hedera. The DID document contains the wallet's public key and, once linked, the ORCID identifier hash.
- **Resolution:** DID documents are resolved via Hedera's mirror node. Any party can resolve a DID to verify the associated public key and ORCID.
- **Updates (WC5):** When a user links ORCID, the DID document is updated to include the ORCID hash. This update itself is recorded on Hedera.
- **DID-to-Wallet mapping:** The DID is deterministically derived from the wallet's public key. This means wallet reconnection automatically resolves the DID (WC8).

### 4.4 Signature Verification

For authorship contracts (FR-1.3), the signing flow is:

1. Contract content is serialized to canonical JSON (deterministic key ordering, no whitespace).
2. SHA-256 hash is computed from the canonical JSON.
3. The signer's wallet signs the hash (ED25519 for HashPack, ECDSA for MetaMask).
4. The signature + signer DID + contract hash are submitted as an HCS message.
5. **Verification:** Anyone can re-serialize the contract, recompute the hash, resolve the signer's DID to get their public key, and verify the signature against the hash.

---

## 5. Off-Chain Storage Recommendation

### Options Analysis

| Criterion | IPFS (e.g., Pinata/web3.storage) | AWS S3 | Hybrid |
|-----------|----------------------------------|--------|--------|
| Web3 alignment | Strong (content-addressed) | Centralized | Partial |
| Reliability | Pinning services vary | 99.999% durability | Best of both |
| Privacy control | Public by default; encryption needed for private drafts | Fine-grained IAM | S3 for private, IPFS for public |
| Vercel integration | Custom integration needed | Native SDK, presigned URLs | More complex |
| Cost at scale | Pinning costs for millions of papers | Predictable, cheap | Combined costs |
| Content addressing | CID is a natural hash | Need separate hash tracking | Mixed |
| GDPR deletion | Unpinning != guaranteed deletion | Hard delete supported | S3 for GDPR data |

### Recommendation: S3-Compatible Storage with Content-Addressed Naming

Use **Cloudflare R2** (S3-compatible, no egress fees, good Vercel integration) with objects keyed by their SHA-256 hash. This gives you the content-addressing benefits of IPFS with the reliability and privacy controls of centralized storage.

**Bucket structure:**

```
papers/{sha256hash}          # Paper PDFs
datasets/{sha256hash}        # Dataset files
environments/{sha256hash}    # Dockerfiles, environment.yml
reviews/{sha256hash}         # Full review content
```

Because the object key IS the hash, you get natural deduplication and verification: download the file, hash it, compare to the key. The on-chain hash and the storage key are the same value.

**For the future (v2+):** Add IPFS as a secondary distribution layer for published (public) papers. Pin the content-addressed files to IPFS after publication for decentralized availability. This is additive and doesn't require re-architecture.

### Upload Flow

1. Client computes SHA-256 of the file.
2. Client requests a presigned upload URL from the API, passing the hash.
3. API generates a presigned PUT URL to `s3://bucket/papers/{hash}`.
4. Client uploads directly to S3 (no file passes through the API serverless function -- important for Vercel's 4.5MB body size limit).
5. API verifies the upload exists and records the hash in the database.

---

## 6. Database Schema Design

Using PostgreSQL (Neon) with Drizzle ORM. Below is the core schema -- normalized for integrity, with indexes optimized for the query patterns implied by each page in the PRD.

### 6.1 Core Tables

```sql
-- Users / Identity
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    did             TEXT UNIQUE NOT NULL,            -- did:hedera:...
    wallet_address  TEXT UNIQUE NOT NULL,
    wallet_type     TEXT NOT NULL,                   -- 'hashpack' | 'metamask'
    display_name    TEXT,
    institution     TEXT,
    bio             TEXT,
    orcid_id        TEXT UNIQUE,                     -- Linked ORCID
    orcid_token_enc TEXT,                            -- Encrypted OAuth token
    roles           TEXT[] NOT NULL DEFAULT '{}',    -- ['author','reviewer','editor']
    research_fields TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Papers
CREATE TABLE papers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    abstract        TEXT,
    status          TEXT NOT NULL DEFAULT 'draft',
    -- 'draft','registered','contract_pending','submitted',
    -- 'under_review','revision_requested','published','retracted'
    visibility      TEXT NOT NULL DEFAULT 'private', -- 'private' | 'public'
    current_version INT NOT NULL DEFAULT 1,
    owner_did       TEXT NOT NULL REFERENCES users(did),
    journal_id      UUID REFERENCES journals(id),
    contract_id     UUID REFERENCES authorship_contracts(id),
    research_fields TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Paper Versions (FR-3)
CREATE TABLE paper_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id            UUID NOT NULL REFERENCES papers(id),
    version_number      INT NOT NULL,
    paper_hash          TEXT NOT NULL,           -- SHA-256 of paper file
    dataset_hash        TEXT,                    -- SHA-256 of dataset
    dataset_url         TEXT,                    -- External dataset URL
    code_commit_hash    TEXT,                    -- Git commit hash
    code_repo_url       TEXT,                    -- GitHub/GitLab URL
    environment_hash    TEXT,                    -- SHA-256 of env spec
    file_storage_key    TEXT,                    -- S3 object key
    hedera_topic_id     TEXT,                    -- HCS topic
    hedera_tx_id        TEXT,                    -- Transaction ID
    hedera_timestamp    TIMESTAMPTZ,            -- Consensus timestamp
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(paper_id, version_number)
);

-- Authorship Contracts (FR-1)
CREATE TABLE authorship_contracts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id        UUID REFERENCES papers(id),
    paper_title     TEXT,                        -- For contracts created before paper registration
    contract_hash   TEXT NOT NULL,               -- SHA-256 of canonical JSON
    status          TEXT NOT NULL DEFAULT 'pending',
    -- 'pending','partially_signed','fully_signed','superseded'
    version         INT NOT NULL DEFAULT 1,      -- Increments on modification
    creator_did     TEXT NOT NULL REFERENCES users(did),
    hedera_tx_id    TEXT,                        -- Set when fully signed and recorded
    hedera_timestamp TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Contract Contributors
CREATE TABLE contract_contributors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id         UUID NOT NULL REFERENCES authorship_contracts(id),
    contributor_did     TEXT,                    -- NULL if off-platform invite
    contributor_wallet  TEXT,
    contributor_orcid   TEXT,
    contributor_name    TEXT,
    contribution_pct    DECIMAL(5,2) NOT NULL,   -- e.g., 33.33
    role_description    TEXT,
    signature           TEXT,                    -- Wallet signature of contract hash
    signature_tx_id     TEXT,                    -- HCS tx for this signature
    signed_at           TIMESTAMPTZ,
    status              TEXT DEFAULT 'pending',  -- 'pending','signed','declined'
    invite_token        TEXT UNIQUE,             -- For off-platform invitations
    display_order       INT NOT NULL
);

-- Journals
CREATE TABLE journals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    issn            TEXT,
    editor_did      TEXT NOT NULL REFERENCES users(did),
    reputation_score DECIMAL(3,2) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Submissions
CREATE TABLE submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id        UUID NOT NULL REFERENCES papers(id),
    journal_id      UUID NOT NULL REFERENCES journals(id),
    version_id      UUID NOT NULL REFERENCES paper_versions(id),
    contract_id     UUID NOT NULL REFERENCES authorship_contracts(id),
    status          TEXT NOT NULL DEFAULT 'submitted',
    -- 'submitted','criteria_published','reviewers_assigned',
    -- 'under_review','decision_pending','published','rejected','revision_requested'
    criteria_hash   TEXT,                       -- Hash of published criteria
    criteria_tx_id  TEXT,                       -- HCS tx for criteria
    decision        TEXT,                       -- 'accept','reject','revise'
    decision_justification TEXT,                -- Required for rejection
    decision_tx_id  TEXT,                       -- HCS tx for decision
    review_deadline TIMESTAMPTZ,
    submitted_at    TIMESTAMPTZ DEFAULT now(),
    decided_at      TIMESTAMPTZ,
    hedera_tx_id    TEXT                        -- Submission event tx
);

-- Review Criteria (FR-4.1)
CREATE TABLE review_criteria (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id   UUID NOT NULL REFERENCES submissions(id),
    criteria_json   JSONB NOT NULL,             -- Array of criteria objects
    criteria_hash   TEXT NOT NULL,              -- SHA-256 of canonical JSON
    hedera_tx_id    TEXT,
    published_at    TIMESTAMPTZ
);

-- Reviews (FR-6.1)
CREATE TABLE reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id       UUID NOT NULL REFERENCES submissions(id),
    reviewer_did        TEXT NOT NULL REFERENCES users(did),
    review_hash         TEXT,                   -- SHA-256 of review content
    criteria_evaluations JSONB,                 -- Per-criterion ratings
    strengths           TEXT,
    weaknesses          TEXT,
    questions           TEXT,
    confidential_comments TEXT,                 -- NOT on-chain
    recommendation      TEXT,                   -- 'accept','minor','major','reject'
    status              TEXT DEFAULT 'assigned',-- 'assigned','in_progress','submitted','late'
    deadline            TIMESTAMPTZ,
    hedera_tx_id        TEXT,
    submitted_at        TIMESTAMPTZ,
    assigned_at         TIMESTAMPTZ DEFAULT now()
);

-- Reviewer Ratings (FR-6.2, FR-6.3)
-- NOTE: NO author reference column -- ensures reviewer anonymity by design
CREATE TABLE reviewer_ratings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id       UUID NOT NULL REFERENCES reviews(id) UNIQUE,
    rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    rating_hash     TEXT NOT NULL,              -- One-way hash for dedup
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Reputation Log (FR-5.3 -- append-only, never update or delete rows)
CREATE TABLE reputation_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_did        TEXT NOT NULL REFERENCES users(did),
    event_type      TEXT NOT NULL,
    -- 'review_completed','review_late','editor_rating',
    -- 'author_rating','paper_retracted','paper_published'
    score_delta     DECIMAL(5,2),
    details         JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Computed Reputation Scores (materialized view / computed table)
CREATE TABLE reputation_scores (
    user_did            TEXT PRIMARY KEY REFERENCES users(did),
    overall_score       DECIMAL(5,2) DEFAULT 0,
    timeliness_score    DECIMAL(5,2) DEFAULT 0,
    editor_rating_avg   DECIMAL(5,2) DEFAULT 0,
    author_rating_avg   DECIMAL(5,2) DEFAULT 0,
    publication_score   DECIMAL(5,2) DEFAULT 0,
    review_count        INT DEFAULT 0,
    last_computed_at    TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_did        TEXT NOT NULL REFERENCES users(did),
    type            TEXT NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT,
    link            TEXT,                       -- Internal navigation path
    is_read         BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Activity Log (for dashboard feeds)
CREATE TABLE activity_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_did        TEXT NOT NULL,
    paper_id        UUID REFERENCES papers(id),
    action          TEXT NOT NULL,
    details         JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Retraction Records (FR-7 -- display only in MVP)
CREATE TABLE retractions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id            UUID NOT NULL REFERENCES papers(id),
    requesting_party    TEXT NOT NULL,
    reason              TEXT NOT NULL,
    failed_component    TEXT NOT NULL,          -- 'data','analysis','review','ethics'
    hedera_tx_id        TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);
```

### 6.2 Key Indexes

```sql
-- Paper lookups
CREATE INDEX idx_papers_owner ON papers(owner_did);
CREATE INDEX idx_papers_status ON papers(status);
CREATE INDEX idx_paper_versions_paper ON paper_versions(paper_id);
CREATE INDEX idx_paper_versions_hash ON paper_versions(paper_hash);

-- Contract lookups
CREATE INDEX idx_contracts_creator ON authorship_contracts(creator_did);
CREATE INDEX idx_contributors_contract ON contract_contributors(contract_id);
CREATE INDEX idx_contributors_did ON contract_contributors(contributor_did);

-- Review lookups
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_did);
CREATE INDEX idx_reviews_submission ON reviews(submission_id);
CREATE INDEX idx_reviews_status ON reviews(status);

-- Submission pipeline
CREATE INDEX idx_submissions_journal ON submissions(journal_id, status);
CREATE INDEX idx_submissions_paper ON submissions(paper_id);

-- Reputation
CREATE INDEX idx_reputation_events_did ON reputation_events(user_did, created_at);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_did, is_read, created_at);

-- Activity
CREATE INDEX idx_activity_user ON activity_log(user_did, created_at DESC);

-- Full-text search for Paper Explorer (PV-2)
CREATE INDEX idx_papers_search ON papers USING gin(
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(abstract,''))
);
```

---

## 7. API Design

### 7.1 Authentication Flow

Every authenticated request carries a session token obtained through the wallet signature flow:

1. Client -> `GET /api/auth/session` (check existing session)
2. If no session:
   1. Client constructs sign-in message: `"Sign in to [Platform] at [timestamp]"`
   2. Wallet signs the message
   3. Client -> `POST /api/auth/verify-wallet { walletAddress, signature, message }`
   4. Server verifies signature against the wallet's public key
   5. Server looks up (or creates) the user by wallet address
   6. Server returns a signed JWT (short-lived, stored in httpOnly cookie)
3. All subsequent API calls include the JWT cookie

**Why JWT over session table:** On Vercel serverless, there's no persistent in-memory session store. JWTs are stateless and verifiable per request. Token refresh uses a sliding window -- each API call within the expiry window returns a refreshed token.

### 7.2 Key API Contracts

#### Register Paper Draft (`POST /api/papers`)

```typescript
// Request
{
  title: string;
  abstract: string;
  visibility: 'private' | 'public';
  paperHash: string;          // Client-computed SHA-256
  datasetHash?: string;
  codeCommitHash?: string;
  codeRepoUrl?: string;
  environmentHash?: string;
  researchFields: string[];
}

// Response
{
  paperId: string;
  versionId: string;
  hederaTxId: string;
  hederaTimestamp: string;
  status: 'registered';
}
```

#### Sign Authorship Contract (`POST /api/contracts/:id/sign`)

```typescript
// Request
{
  signature: string;           // Wallet signature of contractHash
  signerDid: string;
}

// Response
{
  signatureTxId: string;       // HCS transaction for this individual signature
  contractStatus: 'partially_signed' | 'fully_signed';
  fullySignedTxId?: string;    // Set when this was the final signature
}
```

#### Publish Review Criteria (`POST /api/journals/:id/criteria`)

```typescript
// Request
{
  submissionId: string;
  criteria: Array<{
    label: string;
    evaluationType: 'yes_no_partially' | 'scale_1_5';
    description?: string;
  }>;
}

// Response
{
  criteriaHash: string;
  hederaTxId: string;
}
```

#### Submit Review (`POST /api/reviews/:id`)

```typescript
// Request
{
  criteriaEvaluations: Array<{
    criterionHash: string;
    rating: string;
    comment?: string;
  }>;
  strengths: string;
  weaknesses: string;
  questions: string;
  confidentialComments?: string;  // Stored off-chain only
  recommendation: 'accept' | 'minor' | 'major' | 'reject';
  reviewHash: string;            // Client-computed hash of review content
}

// Response
{
  hederaTxId: string;
  hederaTimestamp: string;
}
```

---

## 8. Authentication & Identity Architecture

### 8.1 Identity Stack

```
+-----------------------------------+
|         ORCID (Academic)          |  <- OAuth 2.0 link
+-----------------------------------+
|      DID:Hedera (Decentralized)   |  <- On-chain identity document
+-----------------------------------+
|  Wallet (HashPack / MetaMask)     |  <- Authentication primitive
+-----------------------------------+
```

- **Wallet** is the root of trust. It's what the user "has."
- **DID** is the persistent identity. It's derived from the wallet but exists independently on Hedera. All on-chain references use the DID, not the wallet address directly.
- **ORCID** bridges to the academic identity system. It provides human-meaningful identity and Sybil resistance (one real researcher = one ORCID).

### 8.2 Wallet Adapter

```typescript
// lib/wallet/adapter.ts
interface WalletAdapter {
  connect(): Promise<{ address: string; publicKey: string }>;
  disconnect(): Promise<void>;
  signMessage(message: string): Promise<string>;
  signTransaction(tx: Transaction): Promise<Transaction>;
  getNetwork(): Promise<'mainnet' | 'testnet'>;
  onAccountChange(callback: (address: string) => void): void;
}

// Implementations
class HashPackAdapter implements WalletAdapter { ... }
class MetaMaskAdapter implements WalletAdapter { ... }
```

### 8.3 Session Management (WC10)

Per the spec: "No localStorage; use in-memory session with wallet re-auth on refresh."

- **In-app state:** React context holds wallet connection state and user profile in memory.
- **Session persistence:** httpOnly JWT cookie (not localStorage). On page refresh, the cookie is sent automatically. The API validates it, and the frontend re-initializes wallet connection silently.
- **Wallet re-auth:** If the JWT is valid but wallet is disconnected (page refresh), the frontend prompts a silent reconnect. If the wallet address doesn't match the JWT's claim, the session is invalidated.

---

## 9. Frontend Architecture

### 9.1 State Management

React Context Providers (nested in root layout):

```
├── WalletProvider         -- Connection state, adapter instance
├── AuthProvider           -- User profile, DID, roles, session JWT
├── RoleProvider           -- Active role, role switching
└── NotificationProvider   -- Real-time notification count
```

For complex page state (contract builder, review workspace), use `useReducer` locally within those pages rather than global state. Keep global state minimal.

### 9.2 Key Shared Components

```
components/
├── wallet/
│   ├── WalletConnectButton.tsx
│   ├── WalletSelector.tsx        # HashPack vs MetaMask
│   └── WalletStatus.tsx          # Address, network indicator
├── identity/
│   ├── OrcidLinkButton.tsx
│   └── DidDisplay.tsx
├── hedera/
│   ├── TransactionLink.tsx       # Clickable tx hash -> Hedera explorer
│   ├── HashDisplay.tsx           # Truncated hash with copy
│   └── OnChainBadge.tsx          # Verified-on-chain indicator
├── paper/
│   ├── PaperCard.tsx
│   ├── PaperStatusBadge.tsx
│   ├── ProvenancePanel.tsx
│   └── VersionGraph.tsx
├── contract/
│   ├── ContributorTable.tsx
│   ├── SignatureStatus.tsx
│   └── ContractPreview.tsx
├── review/
│   ├── CriteriaChecklist.tsx
│   ├── ReviewForm.tsx
│   └── MethodologyReminder.tsx
├── dashboard/
│   ├── DashboardShell.tsx        # Top bar, nav, role switcher
│   ├── SummaryCard.tsx
│   ├── ActivityFeed.tsx
│   └── PendingActions.tsx
└── ui/
    ├── DataTable.tsx             # Reusable sortable/filterable table
    ├── SearchBar.tsx
    └── FileUploadWithHash.tsx    # Upload + client-side SHA-256
```

### 9.3 Client-Side Hashing

```typescript
// lib/hashing.ts
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashString(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Deterministic JSON serialization: sorted keys, no whitespace
// Use RFC 8785 (json-canonicalize) in production for full spec compliance
export function canonicalJson(obj: object): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}
```

---

## 10. Data Flow Diagrams

### 10.1 Paper Registration Flow

```
Author (Browser)                    API                         Hedera          S3
    |                                |                            |              |
    |  1. Fill paper details         |                            |              |
    |  2. Upload PDF                 |                            |              |
    |  3. hashFile(pdf) -> paperHash |                            |              |
    |  4. hashFile(dataset) -> dHash |                            |              |
    |                                |                            |              |
    |-- GET /api/upload-url -------->|                            |              |
    |<-- presigned S3 URL -----------|                            |              |
    |-- PUT pdf ---------------------|----------------------------|----------->>|
    |                                |                            |              |
    |-- POST /api/papers ----------->|                            |              |
    |   { paperHash, dHash, ... }    |-- HCS submit ------------>|              |
    |                                |   (papers topic)           |              |
    |                                |<-- receipt { txId, ts } --|              |
    |                                |                            |              |
    |                                |  Store in DB:              |              |
    |                                |  paper + version + txId    |              |
    |<-- { paperId, txId, ts } ------|                            |              |
```

### 10.2 Authorship Contract Signing Flow

```
Lead Author              Co-Author               API                 Hedera
    |                        |                     |                    |
    |  Create contract       |                     |                    |
    |  Define contributors   |                     |                    |
    |-- POST /contracts ---->|                     |                    |
    |                        |  <-- Notification --|                    |
    |                        |                     |                    |
    |  Sign own portion      |                     |                    |
    |  wallet.sign(hash) --->|                     |                    |
    |-- POST /sign --------->|-- HCS (signature) ->|                    |
    |                        |                     |                    |
    |                        |  Review & Sign       |                    |
    |                        |  wallet.sign(hash)-->|                    |
    |                        |-- POST /sign ------->|-- HCS (signature)->|
    |                        |                     |                    |
    |                        |       All signed?    |                    |
    |                        |       Yes ---------->|-- HCS (fullySigned)|
    |                        |                     |                    |
    |  <-- Contract fully signed, proceed to submit |                   |
```

### 10.3 Review & Decision Flow

```
Editor                   Reviewer               API                 Hedera
  |                         |                     |                    |
  | Publish criteria        |                     |                    |
  |-- POST /criteria ------>|                     |-- HCS criteria --->|
  |                         |                     |                    |
  | Assign reviewer         |                     |                    |
  |-- POST /assign -------->|  <-- Notification --|                    |
  |                         |                     |                    |
  |                         |  Evaluate paper      |                    |
  |                         |  hash(review) ------>|                    |
  |                         |-- POST /review ----->|-- HCS review ---->|
  |                         |                     |                    |
  |  <-- Reviews complete --|                     |                    |
  |                         |                     |                    |
  | All criteria met?       |                     |                    |
  | YES -> must publish     |                     |                    |
  |-- POST /decisions ----->|                     |-- HCS decision --->|
  |   { decision: accept }  |                     |                    |
  |                         |                     |                    |
  | NO -> reject requires   |                     |                    |
  |   justification         |                     |                    |
  |-- POST /decisions ----->|                     |-- HCS decision --->|
  |   { decision: reject,   |                     |   (with justif.)   |
  |     justification }     |                     |                    |
```

---

## 11. Deployment Architecture

### 11.1 Vercel Configuration

```
Vercel Project
├── Framework: Next.js (App Router)
├── Build: next build
├── Environment Variables:
│   ├── NEXT_PUBLIC_THIRDWEB_CLIENT_ID
│   ├── HEDERA_NETWORK              # mainnet | testnet
│   ├── HEDERA_OPERATOR_ID          # Operator account for HCS submissions
│   ├── HEDERA_OPERATOR_KEY         # (encrypted via Vercel secrets)
│   ├── DATABASE_URL                # PostgreSQL connection string
│   ├── S3_BUCKET                   # Cloudflare R2 or AWS S3 bucket name
│   ├── S3_ACCESS_KEY_ID
│   ├── S3_SECRET_ACCESS_KEY
│   ├── S3_ENDPOINT                 # For R2 compatibility
│   ├── ORCID_CLIENT_ID
│   ├── ORCID_CLIENT_SECRET
│   ├── JWT_SECRET
│   ├── UPSTASH_REDIS_REST_URL
│   ├── UPSTASH_REDIS_REST_TOKEN
│   └── GITHUB_OAUTH_CLIENT_*      # For GitHub repo linking
├── Cron Jobs (vercel.json):
│   ├── /api/cron/reputation        # Recompute reputation scores (hourly)
│   ├── /api/cron/deadlines         # Check review deadlines (hourly)
│   └── /api/cron/cleanup           # Expire stale invite tokens (daily)
└── Edge Config:
    └── Feature flags, HCS topic IDs
```

### 11.2 Infrastructure Diagram

```
                    +----------------+
                    |   Cloudflare   |
                    |   (CDN/DNS)    |
                    +-------+--------+
                            |
                    +-------v--------+
                    |    Vercel      |
                    |  +---------+  |
                    |  | Next.js |  |
                    |  |  App    |  |
                    |  +----+----+  |
                    |       |       |
                    |  +----v----+  |     +------------------+
                    |  |  API    |--+---->|  PostgreSQL       |
                    |  | Routes  |  |     |  (Neon)           |
                    |  +----+----+  |     +------------------+
                    |       |       |
                    +-------+-------+
                            |
              +-------------+-------------+
              |             |             |
      +-------v------+ +---v-----+ +----v------+
      |   Hedera     | | R2/S3   | | Upstash   |
      |  (Mainnet)   | | Storage | | Redis     |
      |  HCS + DID   | |  Files  | |  Cache    |
      +--------------+ +---------+ +-----------+
```

### 11.3 Database Hosting

**Neon** (serverless PostgreSQL) is the best fit for Vercel:

- Serverless driver (no connection pooling issues with Vercel functions)
- Auto-scaling
- Branching for preview deployments
- Free tier generous enough for MVP

---

## 12. Security Architecture

### 12.1 Threat Model & Mitigations

| Threat | Mitigation |
|--------|-----------|
| Wallet impersonation | Signature verification on every auth. DID resolution confirms wallet ownership. |
| Hash tampering | Client-side hashing is verifiable by anyone. On-chain hash is the source of truth. |
| Contract modification after signing | Any change invalidates all signatures (AC-5). Previous versions retained on-chain (AC-9). |
| Review content tampering | Review hash on-chain. Full content off-chain can be re-hashed and compared. |
| Reviewer de-anonymization via ratings | Ratings stored with one-way hash, no author identifier in the record (PR-8). |
| Off-chain data loss | S3/R2 cross-region replication. Database daily backups. On-chain hashes serve as integrity anchors -- content can be verified even if re-uploaded. |
| Operator key compromise | Hedera operator key used only for HCS submissions. Rotatable. Scoped to topic message submission only, not token transfers. |
| XSS / CSRF | httpOnly cookies for JWT. CSP headers. Input sanitization. |

### 12.2 Data Classification

| Classification | Examples | Storage | On-Chain |
|---------------|----------|---------|----------|
| Public | Published papers, authorship contracts, reputation scores, review criteria | DB + S3 | Hash + metadata |
| Restricted | Private drafts, review content pre-decision, confidential editor comments | DB + S3 (encrypted) | Hash only |
| Sensitive | ORCID OAuth tokens, wallet association metadata | DB (encrypted columns) | Never |
| Never stored | Paper content on-chain, reviewer identity in ratings | -- | -- |

---

## 13. Scalability Considerations

### 13.1 Vercel-Specific Constraints

- **Serverless function timeout:** 60s (Pro plan). HCS submissions typically complete in < 5s, well within limits.
- **Body size limit:** 4.5MB on serverless functions. Paper PDFs upload directly to S3 via presigned URLs, bypassing this limit.
- **Cold starts:** Mitigated by Vercel's edge network. Critical paths (dashboard loads) should target < 300ms (NFR-1).
- **Concurrent functions:** No hard limit on Pro plan, but connection pooling to PostgreSQL is critical -- use Neon's serverless driver or PgBouncer.

### 13.2 Database Scaling Path

| Stage | Papers | Strategy |
|-------|--------|----------|
| MVP | < 10K | Single Neon instance, basic indexes |
| Growth | 10K - 1M | Read replicas for public explorer, full-text search optimization |
| Scale | 1M+ | Consider dedicated search (e.g., Typesense) for explorer. Partition `paper_versions` and `reputation_events` by date. |

### 13.3 HCS Scaling

HCS topics handle high throughput natively. At millions of papers (NFR-3), the bottleneck won't be HCS submission but mirror node queries for verification. Mitigation: cache frequently verified hashes in Redis/KV. The verification endpoint (`/api/hedera/verify`) should check cache first, then mirror node.

---

## 14. Open Questions & Risks

### 14.1 Open Architectural Decisions

| # | Question | Recommendation | Decision Needed |
|---|----------|---------------|----------------|
| 1 | Hedera mainnet vs testnet for MVP launch? | Testnet during development, mainnet for production. Consider a "testnet preview" mode for early adopters. | Before launch |
| 2 | HCS topic per domain vs per journal? | Per domain (Section 4.1). Per-journal topics could be added later for journal-specific audit trails. | Now (go with domain topics) |
| 3 | Reputation computation: real-time vs batch? | Batch (hourly cron). Real-time is complex and the score doesn't need second-level freshness. | Now (go with batch) |
| 4 | Confidential editor comments: stored at all? | Store off-chain only, never hashed on-chain. Clearly marked in UI. | Now |
| 5 | Notification delivery: polling vs WebSocket? | Polling in MVP (simple, works on Vercel). Upgrade to WebSocket or SSE via a service like Ably/Pusher if needed. | MVP: polling |
| 6 | Multi-editor journal support? | Out of scope for MVP (single editor per journal). DB schema supports it -- add `journal_editors` join table in v2. | Deferred |

### 14.2 Key Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Hedera SDK compatibility with Vercel Edge | Hedera SDK is Node.js-based. May not work in Edge Runtime. | Use Node.js runtime for API routes (not Edge). Vercel supports this per-route via `export const runtime = 'nodejs'`. |
| Wallet UX friction | Non-crypto-native researchers may struggle with wallet setup. | Clear onboarding flow (Page 2). Consider adding WalletConnect protocol support in v2 for broader wallet support. |
| ORCID rate limits | High sign-up volume could hit ORCID OAuth rate limits. | Cache ORCID tokens, implement retry with backoff, consider ORCID member API for higher limits. |
| Gas/fee costs at scale | Millions of HCS messages = significant HBAR cost. | Batch HCS messages where possible (e.g., batch all signatures for a contract into one message when fully signed). Monitor and set budget alerts. |
| Canonical JSON determinism | Different JSON serialization across browsers/platforms could produce different hashes. | Use a well-tested canonical JSON library (e.g., `json-canonicalize` npm package per RFC 8785). Test across browsers. |

---

## Appendix A: Technology Choices Summary

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Frontend framework | Next.js 15 (App Router) | Per spec; SSR for public pages, CSR for dashboards |
| Deployment | Vercel | Per spec; native Next.js support |
| Blockchain | Hedera (HCS + DID) | Per spec; fast finality, low fees |
| Database | PostgreSQL via Neon | Serverless-compatible, Vercel-native |
| ORM | Drizzle ORM | Type-safe, lightweight, good Neon support |
| File storage | Cloudflare R2 | S3-compatible, zero egress, good Vercel integration |
| Cache | Upstash Redis | Serverless Redis, Vercel integration |
| Background jobs | Vercel Cron + QStash (Upstash) | Serverless-compatible scheduled tasks |
| Wallet SDKs | HashPack SDK + wagmi/ethers.js | Per spec |
| ORCID | OAuth 2.0 Public API | Per spec (NFR-5) |
| Hashing | Web Crypto API (SubtleCrypto) | Browser-native, no dependencies |
| Canonical JSON | RFC 8785 (json-canonicalize) | Deterministic cross-platform serialization |

## Appendix B: MVP Scope Boundary

**Features included in MVP architecture (from SRS appendix):**

- FR-1: Authorship Contracts
- FR-2: Paper Registration
- FR-3: Versioning & Provenance
- FR-4: Pre-Registered Peer Review
- FR-5.1-5.4: Reviewer Reputation (excluding Sybil resistance)
- FR-6: Reviewer Feedback Transparency
- FR-7: Retraction (display only)

**Deferred to v2+:**

- FR-5.5: Sybil resistance
- FR-7: Retraction write/management
- FR-8: Funding-linked timelines
- FR-9: Fraud insurance
- FR-10: Commercial IP tagging
- FR-11: AI-generated review detection

The architecture is designed to accommodate all deferred features without structural changes -- the HCS topic strategy, DB schema, and API patterns all have natural extension points for v2+ features.
