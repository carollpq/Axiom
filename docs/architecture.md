# Architecture Design Document v3
## Axiom — Blockchain-Backed Review Fairness for Academic Publishing

**Version:** 3.0  
**Stack:** Next.js 15 · Hedera (HCS + HTS + Smart Contracts + DID) · Lit Protocol · Vercel  
**Date:** February 2026  
**Hackathon:** Hedera Hello Future: Apex

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Adoption Strategy — Why Journals Join](#2-adoption-strategy)
3. [High-Level System Architecture](#3-high-level-system-architecture)
4. [Core Feature Architecture](#4-core-feature-architecture)
5. [Hedera Integration Architecture](#5-hedera-integration-architecture)
6. [HTS Soulbound Reputation Tokens](#6-hts-soulbound-reputation-tokens)
7. [Lit Protocol — Review-Phase Access Control](#7-lit-protocol)
8. [Rebuttal Phase Architecture](#8-rebuttal-phase-architecture)
9. [Timeline Enforcement](#9-timeline-enforcement)
10. [Off-Chain Storage Architecture](#10-off-chain-storage-architecture)
11. [Database Schema Design](#11-database-schema-design)
12. [API Design](#12-api-design)
13. [Authentication & Identity Architecture](#13-authentication--identity-architecture)
14. [Frontend Architecture](#14-frontend-architecture)
15. [Data Flow Diagrams](#15-data-flow-diagrams)
16. [Deployment Architecture](#16-deployment-architecture)
17. [Security Architecture](#17-security-architecture)
18. [Future Roadmap](#18-future-roadmap)
19. [Open Questions & Risks](#19-open-questions--risks)

---

## 1. Architecture Overview

### What Axiom Solves

Axiom focuses on the **review process** — the stage where academic publishing is most broken. We don't ask journals to change their business model. We give them tools that make their review process fairer, faster, and more credible.

**The core problem:** Peer review quality is invisible and unaccountable. Reviewers can write vague, lazy, or biased reviews with no consequences. There's no portable record of reviewer quality, no structured way to evaluate reviews, and no recourse for authors who receive unfair feedback. This is the most underdeveloped part of the current ecosystem.

**Problems we solve (validated by researchers):**
- Reviewers give unstructured, vague feedback with no accountability
- Reviewer effort and quality is invisible and non-portable across journals
- Reviews take 5–6 months with no communication to authors
- 80% of reviewers submit late or not at all
- Reviewers have unchecked power — can reject for irrelevant reasons with no justification
- No accountability for low-quality or biased reviews
- Authors can't rebut unfair reviews before rejection
- Authorship disputes have no cryptographic proof
- Idea theft is hard to disprove without verifiable timestamps

**What we do NOT change (for adoption):**
- Journal revenue models stay the same
- Subscription/paywall structures are untouched
- Journals keep editorial control
- Review anonymity is preserved (reviewers are anonymous to authors, but accountable to the system)

### Design Principles

- **Hash-on-chain, content-off-chain.** No paper content, review text, or PII on Hedera. Only hashes and metadata.
- **Client-side hashing.** All SHA-256 hashes computed in-browser via Web Crypto API.
- **Journal-friendly.** Zero disruption to existing revenue models. Journals gain credibility and operational tools.
- **Reviewer accountability without doxxing.** Reputation is public and portable; identity stays anonymous to authors.
- **Append-only integrity.** On-chain records are immutable. Off-chain mirrors are append-only.
- **Decentralized access control.** Paper privacy during review enforced by Lit Protocol, not server trust.
- **Portable reputation.** Reviewer reputation lives as soulbound HTS tokens, not in any journal's database.

---

## 2. Adoption Strategy — Why Journals Join

### The Key Insight

Journals won't adopt a system that threatens their revenue. But they *will* adopt a system that:

1. **Makes them more credible** — on-chain proof of fair review practices
2. **Solves operational pain** — finding reliable reviewers, managing timelines
3. **Differentiates them from competitors** — "Axiom-verified review process"
4. **Costs them nothing** in terms of current revenue

### What Journals Get

| Problem | Axiom Solution | Journal Benefit |
|---|---|---|
| Finding good reviewers | Cross-journal reputation scores (HTS tokens) | Search reviewers by verifiable track record |
| Slow reviewers | On-chain timeline enforcement with deadline tracking | Automated deadline reminders, public accountability |
| Reviewer quality variance | Structured criteria evaluation + author ratings | Data-driven reviewer selection |
| Author complaints about unfairness | Pre-registered criteria + rebuttal phase | Defensible, transparent process |
| Editorial credibility | All commitments recorded on-chain | "Axiom-verified" trust signal |

### What Researchers Get

| Problem | Axiom Solution |
|---|---|
| Months of silence | Real-time status updates (reviewers assigned, reviews submitted, decision pending) |
| Vague / unhelpful reviews | Per-criterion structured evaluation — reviewers must address specific criteria with comments |
| Unfair rejection | Pre-registered criteria — if rejection contradicts stated criteria, editor must provide public on-chain justification |
| No recourse against bad reviews | Rebuttal phase before final decision — upheld rebuttals give reviewer a negative reputation event |
| Authorship disputes | Cryptographic contribution contracts |
| Idea theft | On-chain timestamped registration (proof of first disclosure) |
| Reviewer power abuse | Anonymous but accountable — reputation system tracks quality |

### What Reviewers Get

Reviewers are the most underserved group in academic publishing. Axiom is primarily built to fix this.

| Problem | Axiom Solution |
|---|---|
| Invisible effort | Portable reputation (HTS soulbound tokens) visible across all journals |
| No recognition for good work | Reputation score improves with quality, timeliness, and author feedback |
| No incentive to give quality feedback | Per-criterion structured reviews + author ratings + post-decision public visibility |
| "Giving back" feels thankless | Verifiable, cross-journal record of contribution to science |
| No feedback on their own reviewing | Author ratings (anonymous) + rebuttal outcomes give reviewers quality signals |

### Adoption Flywheel

```
Journals join (free, no revenue impact)
    → Researchers see journals using Axiom
    → Researchers prefer Axiom-verified journals
    → More journals join to stay competitive
    → Reviewer reputation data grows
    → Better reviewer matching → better reviews
    → More researchers trust the process
    → Cycle reinforces
```

**Hackathon metric:** Every journal, researcher, and reviewer creates a Hedera account (DID + wallet). This directly addresses the judging criterion: "Does the solution lead to more Hedera accounts being created?"

---

## 3. High-Level System Architecture

### Component Map

| Component | Technology | Responsibility |
|---|---|---|
| **Frontend** | Next.js 15 (App Router, Turbopack) | Pages, wallet integration, client-side hashing, Lit encrypt/decrypt |
| **API Layer** | Next.js Route Handlers (Vercel) | Business logic, off-chain CRUD, Hedera submission orchestration |
| **Database** | PostgreSQL (Neon) / SQLite (dev) | Users, papers, contracts, reviews, reputation, submissions |
| **File Storage** | IPFS via web3.storage (Filecoin archival) | Lit-encrypted paper PDFs, datasets, environment specs |
| **Blockchain (Consensus)** | Hedera HCS | Immutable audit logs: papers, contracts, reviews, criteria, decisions |
| **Blockchain (Tokens)** | Hedera HTS | Soulbound reputation NFTs for reviewers |
| **Blockchain (Contracts)** | Hedera Smart Contracts (EVM) | Timeline enforcement, deadline penalties |
| **Blockchain (Identity)** | Hedera DID + ORCID | Decentralized academic identity |
| **Encryption** | Lit Protocol | Decentralized access control during review phase |
| **Wallets** | Thirdweb v5 (HashPack, MetaMask) | Authentication, message signing |
| **Cache** | Upstash Redis (planned) | Rate limiting, session data |

### System Boundaries

```
┌──────────────────────────────────────────────────────────────┐
│                       BROWSER CLIENT                          │
│  Next.js 15 · Thirdweb v5 · Client-side Hashing              │
│  Lit SDK (encrypt/decrypt) · React 19                         │
└───────┬──────────────────────┬───────────────────────────────┘
        │ HTTPS (API Routes)   │ Wallet Signing / Lit Network
        ▼                      ▼
┌────────────────────┐  ┌──────────────────┐  ┌──────────────┐
│  NEXT.JS API LAYER │  │  HEDERA NETWORK  │  │ LIT PROTOCOL │
│  (Vercel Serverless)│  │                  │  │   NETWORK    │
│                    │  │  HCS Topics (7)  │  │              │
│  Business Logic    │  │  HTS Tokens      │  │  Threshold   │
│  Review Workflow   │  │  Smart Contracts │  │  MPC Keys    │
│  Timeline Mgmt    │  │  DID Service     │  │  Access Ctrl │
└────────┬───────────┘  └──────────────────┘  └──────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                   OFF-CHAIN DATA LAYER                         │
│  PostgreSQL/SQLite (structured) · IPFS/Filecoin (encrypted)   │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Core Feature Architecture

### 4.1 Authorship Contribution Contracts (FR-1) ✅ Implemented

Authors formally define contribution percentages, all co-authors cryptographically sign, and the contract is recorded immutably on HCS.

**Current state:** Fully functional. Contract creation → contributor management → wallet signing (verified via viem `verifyMessage`) → HCS anchoring → signature invalidation on modification.

**Key constraints:**
- Contribution percentages must sum to exactly 100%
- All authors must sign before paper can be submitted
- Any modification invalidates all existing signatures
- Previous contract versions retained on-chain (append-only)

### 4.2 Paper Registration & Timestamped Ownership (FR-2) ✅ Implemented

Authors register paper drafts by submitting a cryptographic hash. Each registration includes timestamp, author DID/wallet, and is immutably stored on HCS.

**Current state:** Functional. Client-side SHA-256 hashing → Lit encryption → IPFS upload (web3.storage) → DB storage → HCS anchoring. Study type selection (original / negative result / replication / replication failed / meta-analysis) implemented in registration wizard.

### 4.3 Immutable Paper Versioning & Provenance (FR-3) ✅ Partially Implemented

Each paper version links to dataset hash, code commit hash, and environment hash. Version metadata locked at submission time.

**Current state:** Version creation with provenance hashes works. Version graph UI not yet built.

### 4.4 Pre-Registered Review Criteria (FR-4) ✅ Implemented

**This is the cornerstone feature for review quality and accountability.**

Journals publish review criteria on-chain BEFORE review begins. This is **not** a contractual obligation to publish — journals keep full editorial discretion. The value is that criteria become immutable and public, forcing structured reviewer feedback and creating accountability for rejection decisions.

**Current state:** Fully functional. CriteriaBuilder component in editor incoming-papers view → `POST /api/submissions/[id]/criteria` → canonical JSON hash → HCS anchor → immutable. Editor three-column layout provides sidebar panel for criteria definition.

**How it works:**

1. Editor creates submission-specific review criteria (structured form via CriteriaBuilder sidebar panel)
2. Criteria are hashed and recorded on HCS (`criteria` topic)
3. Criteria become immutable — cannot be changed after publication
4. Reviewers evaluate each criterion individually (yes / no / partially + required comment if not 'yes')
5. System computes whether all criteria are met (`allCriteriaMet`)
6. If criteria met but editor rejects → editor must provide **public on-chain justification** visible to all
7. This creates reputational/social pressure to justify decisions, not a legal obligation to publish

**Why this matters:** Reviewers can no longer write vague rejections — every concern must be tied to a specific stated criterion with a comment explaining the issue. This is the primary mechanism for improving review quality. The accountability for editors is a secondary benefit — journals retain full editorial discretion but must explain decisions that contradict their own stated criteria.

**Schema for criteria:**

```typescript
interface ReviewCriterion {
    id: string;
    label: string;                           // e.g., "Methodology is reproducible"
    evaluationType: 'yes_no_partially' | 'scale_1_5';
    description?: string;                     // Guidance for reviewers
    required: boolean;                        // Must this be "yes" for criteria-met?
}
```

### 4.5 Reviewer Reputation System (FR-5) ✅ Implemented

**The star feature for hackathon differentiation.**

Non-transferable, cross-journal reputation represented as HTS soulbound tokens. Detailed in §6.

**Current state:** Fully functional. HTS tokens minted on review completion, late reviews, editorial decisions, author ratings, and rebuttal resolutions. Reputation scores computed and stored in `reputationScores` table. Editor can view reviewer reputation scores when assigning reviewers.

### 4.6 Reviewer Feedback Transparency (FR-6) ✅ Implemented

After a paper is accepted or rejected, reviewer comments become publicly visible (anonymized). This creates accountability without compromising review-phase anonymity.

**Current state:** Fully functional. `GET /api/papers/[id]/reviews` returns anonymized reviews after final decision. Confidential editor comments always excluded. Editor can view full review comments via ReviewCommentsPanel sidebar.

**Timing:** Comments are NOT public during review. They become public only after the editorial decision is final. This preserves the integrity of the review process while ensuring post-decision transparency.

**Author ratings:** Authors can anonymously rate reviewer usefulness via 5-protocol system (actionable feedback, deep engagement, fair/objective, justified recommendation, appropriate expertise) after seeing the review. Reviewers never know which author rated them (FR-6.3). Ratings feed into reputation scores via HTS token minting.

### 4.7 Rebuttal Phase (NEW) ✅ Implemented

Detailed in §8.

**Current state:** Fully functional. Researcher-initiated via `POST /api/submissions/[id]/author-response`. Editor resolves via ResolveRebuttalPanel sidebar in under-review view. HCS anchoring + HTS reputation tokens on resolution.

### 4.8 Real-Time Author Status Updates ✅ Implemented

Authors receive notifications at every stage:
- "Your paper has been submitted to [Journal]"
- "Reviewers have been assigned (2 of 3)"
- "Review 1 of 3 completed"
- "All reviews completed — decision pending"
- "Revision requested — see review comments"
- "Rebuttal phase open — you have 14 days to respond"
- "Paper accepted / rejected — [view justification]"

**Current state:** Fully functional. DB-backed notifications with NotificationBell component (30s polling). Notifications created at every pipeline stage including "Viewed by Editor" status. Integrated across all editor actions (criteria publish, reviewer assignment, decision, rebuttal resolution).

### 4.9 Negative Result & Replication Tagging ✅ Implemented

Papers can be tagged as `original`, `negative_result`, `replication`, `replication_failed`, or `meta_analysis` at registration time. Study type is recorded on-chain and is immutable.

### 4.10 External Paper Verification Tool ✅ Implemented

Public page (`/verify`) where anyone uploads a PDF and the system checks the hash against all on-chain registrations. No auth required. Great demo moment.

**Current state:** Fully functional. Client-side SHA-256 hash → `POST /api/verify` (no auth) → DB lookup → verification result.

---

## 5. Hedera Integration Architecture

### 5.1 Services Used

| Hedera Service | Purpose in Axiom |
|---|---|
| **HCS** | 7 domain topics for immutable audit logs |
| **HTS** | Soulbound reputation NFTs for reviewers |
| **Smart Contracts (EVM)** | Timeline enforcement deadlines (stretch goal) |
| **DID** | Decentralized identity for all users |
| **Mirror Node** | Query tokens, verify transactions, read reputation history |

### 5.2 HCS Topic Strategy

Domain-scoped topics. Each is an ordered, immutable append-only log.

| Topic | Purpose | Message Schema | Status |
|---|---|---|---|
| `papers` | Draft registrations, version anchoring | `{type, paperHash, authorWallet, studyType, provenanceHashes, visibility, timestamp}` | ✅ Implemented |
| `contracts` | Authorship contract creation, signatures | `{type, contractHash, signerWallet, paperHash, signatures[], contributionSplits[], timestamp}` | ✅ Implemented |
| `submissions` | Paper submission events, status transitions | `{type, paperHash, contractHash, journalId, timestamp}` | ✅ Implemented |
| `criteria` | Journal review criteria publication | `{type, journalId, submissionId, criteriaHash, criteria[], timestamp}` | ✅ Implemented |
| `reviews` | Review hash anchoring + author comments | `{type, reviewHash, reviewerWallet, paperHash, criteriaHash, criteriaEvaluations, timestamp}` | ✅ Implemented |
| `decisions` | Accept/reject with justification, rebuttal requests | `{type, journalId, paperHash, decision, justification?, criteriaHash, allCriteriaMet, timestamp}` | ✅ Implemented |
| `retractions` | Retraction records | `{type, paperHash, requestingParty, reason, failedComponent, timestamp}` | 🔲 Not yet |

#### Additional HCS Events (anchored to existing topics)

| Event | Topic | Payload | Status |
|---|---|---|---|
| `viewed_by_editor` | `submissions` | `{type, submissionId, editorWallet, timestamp}` | ✅ Implemented |
| `assignment_accepted` | `submissions` | `{type, submissionId, reviewerWallet, acceptedCount, timestamp}` | ✅ Implemented |
| `author_response` | `submissions` | `{type, submissionId, action, authorWallet, timestamp}` | ✅ Implemented |
| `rebuttal_requested` | `decisions` | `{type, submissionId, authorWallet, deadline, timestamp}` | ✅ Implemented |
| `author_comment` | `reviews` | `{type, reviewId, commentHash, timestamp}` | ✅ Implemented |

### 5.3 HCS Message Flow

```
Client (Browser)                    API (Serverless)               Hedera
      │                                   │                           │
      │  1. Compute hash client-side      │                           │
      │  2. Sign hash with wallet         │                           │
      │── POST /api/... ────────────────►│                           │
      │                                   │  3. Validate + store DB   │
      │                                   │  4. Submit HCS message ──►│
      │                                   │                           │
      │                                   │◄── Receipt { txId, ts } ──│
      │                                   │  5. Update DB with txId   │
      │◄── { txId, timestamp } ───────────│                           │
```

### 5.4 DID Architecture

Using wallet-based identity via Thirdweb v5. Each user's wallet address serves as their primary identifier. ORCID linking planned for v2 (currently client-side format validation only).

Future: `did:hedera` method with Hedera DID SDK for full decentralized identity with on-chain DID documents.

---

## 6. HTS Soulbound Reputation Tokens

### 6.1 Overview

Reviewer reputation is represented as non-transferable HTS NFTs. Each reputation event mints a token to the reviewer's wallet. This makes reputation:

- **Portable:** Any journal can read a reviewer's token history
- **Non-transferable:** Can't buy, sell, or gift reputation
- **Journal-independent:** No journal owns or controls it (FR-5.4)
- **Verifiable:** Full history auditable via mirror node

### 6.2 Token Design

```
HTS Token: AXIOM_REVIEWER_REPUTATION (AXR)
Type: Non-Fungible Token (NFT)
Supply: Unlimited (minted per event)
Transferable: No (custom fee schedule / admin-only)

Each NFT metadata:
{
    "type": "review_completed" | "review_late" | "review_quality" |
            "editor_rating" | "author_rating" | "paper_published" |
            "paper_retracted" | "rebuttal_upheld" | "rebuttal_overturned",
    "paperId": "hash",
    "journalId": "string",
    "timestamp": "ISO8601",
    "score": number,
    "details": { ... }
}

For `author_rating` events, metadata now includes 5-dimensional quality data:
{
    "type": "author_rating",
    "protocols": {
        "actionable_feedback": 4,
        "deep_engagement": 5,
        "fair_objective": 3,
        "justified_recommendation": 4,
        "appropriate_expertise": 5
    },
    "overall": 4,
    "reviewId": "uuid"
}
```

### 6.3 Reputation Events

| Event | When | Score Impact | Token Minted To |
|---|---|---|---|
| `review_completed` | Review submitted on time | Positive | Reviewer |
| `review_late` | Review submitted past deadline | Negative | Reviewer |
| `review_quality` | Editor rates review quality | Variable (+/-) | Reviewer |
| `editor_rating` | Editor assigns explicit rating | Variable | Reviewer |
| `author_rating` | Author rates reviewer usefulness (anonymous) | Variable | Reviewer |
| `paper_published` | Paper a reviewer reviewed gets published | Positive | Reviewer |
| `paper_retracted` | Paper a reviewer approved gets retracted | Negative | Reviewer |
| `rebuttal_upheld` | Author's rebuttal leads to review being overturned | Negative (for reviewer) | Reviewer |
| `rebuttal_overturned` | Rebuttal is rejected, original review stands | Positive (for reviewer) | Reviewer |

### 6.4 Reputation Score Computation

Computed off-chain (hourly cron), reads HTS token metadata from mirror node:

```
Overall Score = (
    0.30 × Timeliness Score +
    0.25 × Editor Rating Average +
    0.25 × Author Feedback Average +
    0.20 × Publication Outcome Score
)
```

### 6.5 HTS via Hedera System Contracts

Mint tokens from Solidity using Hedera's precompiled HTS interface:

```solidity
import "./hedera/HederaTokenService.sol";

contract ReputationManager is HederaTokenService {
    address public reputationTokenId;

    function mintReputationToken(
        address reviewer,
        bytes memory metadata
    ) external onlyPlatform {
        (int response, , int64[] memory serialNumbers) =
            HederaTokenService.mintToken(reputationTokenId, 0, new bytes[](1));
        require(response == HederaResponseCodes.SUCCESS, "Mint failed");
        HederaTokenService.transferNFT(
            reputationTokenId, address(this), reviewer, serialNumbers[0]
        );
    }
}
```

### 6.6 Reviewer Search by Reputation

Editors can search for reviewers by:
- Overall reputation score (minimum threshold)
- Research field match
- Timeliness score (for deadline-critical reviews)
- Review count (experience level)
- No conflict of interest (not a co-author on the paper)

This is the primary value proposition for journals — they can find proven, reliable reviewers instead of guessing.

---

## 7. Lit Protocol — Review-Phase Access Control

### 7.1 Purpose

During review, paper content must be accessible to specific people (authors, assigned reviewers, editor) but no one else. Lit Protocol enforces this cryptographically.

### 7.2 Access Conditions by Paper State

| Paper State | Who Can Decrypt | Lit Condition |
|---|---|---|
| **Private Draft** | Author(s) on the contract | `walletAddress IN authorWallets` |
| **Under Review** | Authors + assigned reviewers + editor | `walletAddress IN allowedWallets` |
| **Published** | Handled by journal's existing access model | Decrypt and re-upload as plaintext (journal controls distribution) |
| **Retracted** | No one | `false` |

**Key difference from v2:** We do NOT gate published paper access via Lit. Journals keep their existing paywall/subscription model. Lit is used only during the review phase to ensure confidentiality.

### 7.3 Encryption Flow

```
Author                          Lit Network                    IPFS
    │                                │                              │
    │  1. Upload PDF                 │                              │
    │  2. hashFile(pdf) → paperHash  │                              │
    │                                │                              │
    │  3. Create access condition:   │                              │
    │     authors-only for draft     │                              │
    │  4. Request encryption key ───►│                              │
    │  ◄── key shares ──────────────│                              │
    │                                │                              │
    │  5. Encrypt PDF client-side    │                              │
    │  6. POST to /api/upload/ipfs → pin encrypted blob ───────────►│
    │                                │                              │
    │  ✅ On-chain hash = hash of ORIGINAL (unencrypted) file      │
```

### 7.4 Updating Access During Review

When reviewers are assigned, update Lit conditions to include their wallets:

```typescript
async function updatePaperAccessForReview(
    paperId: string,
    authorWallets: string[],
    reviewerWallets: string[],
    editorWallet: string
) {
    const allowedWallets = [...authorWallets, ...reviewerWallets, editorWallet];
    return createCondition({
        type: 'walletInList',
        wallets: allowedWallets
    });
}
```

### 7.5 On Publication

When a paper is accepted and published, the content is decrypted and re-uploaded as plaintext (or handed off to the journal's distribution system). Axiom's Lit encryption role ends at publication.

---

## 8. Rebuttal Phase Architecture

### 8.1 Purpose

Before a final rejection decision, authors can challenge specific reviewer comments they believe are unfair, irrelevant, or factually incorrect. The editor reviews the rebuttal and makes a final decision with full context.

This addresses the P5 problem identified by our research contacts: "Authors are not given the opportunity to rebuttal bad quality reviews before the journal decides on rejection."

### 8.2 Workflow

**Key design decision:** Rebuttals are researcher-initiated, not editor-initiated. After all reviews are submitted, the submission transitions to `reviews_completed` and the researcher decides whether to accept the reviews or request a rebuttal.

```
All reviews submitted → status: reviews_completed
    │
    ▼
Researcher views anonymized reviews + rates each (5-protocol)
    │
    ├── "Accept Reviews" → authorResponseStatus: accepted
    │       → Editor makes final decision
    │
    ├── "Request Rebuttal" → authorResponseStatus: rebuttal_requested
    │       → status: rebuttal_open (14-day deadline)
    │       │
    │       ▼
    │   Author submits rebuttal:
    │   - Per-comment responses (agree / disagree + justification)
    │   - Additional evidence or clarification
    │       │   - Rebuttal hashed and recorded on HCS
    │       │       │
    │       │       ▼
    │       │   Editor reviews rebuttal:
    │       │   - Can overturn specific reviewer objections
    │       │   - Can request targeted revisions
    │       │   - Final decision recorded on-chain with full justification
    │       │       │
    │       │       ▼
    │       │   If rebuttal upheld → reviewer gets negative reputation event
    │       │   If rebuttal rejected → reviewer gets positive reputation event
    │       │
    │       └── Request revisions (standard flow)
    │
    └── Clear rejection → Still allow rebuttal before finalization
```

### 8.3 Rebuttal Data Model

```typescript
interface Rebuttal {
    id: string;
    submissionId: string;
    authorWallet: string;
    status: 'open' | 'submitted' | 'under_review' | 'resolved';
    deadline: Date;                    // 14 days from opening
    responses: RebuttalResponse[];
    rebuttalHash: string;             // SHA-256 of canonical JSON
    hederaTxId?: string;              // HCS anchor
    resolution?: 'upheld' | 'rejected' | 'partial';
    editorNotes?: string;
    resolvedAt?: Date;
}

interface RebuttalResponse {
    reviewId: string;                  // Which review this responds to
    criterionId?: string;              // Which specific criterion (optional)
    position: 'agree' | 'disagree';
    justification: string;             // Author's argument
    evidence?: string;                 // Additional evidence (text or hash reference)
}
```

### 8.4 On-Chain Recording

Rebuttals are hashed and recorded on the `decisions` HCS topic:

```json
{
    "type": "rebuttal_submitted",
    "submissionId": "...",
    "rebuttalHash": "abc123...",
    "authorWallet": "0x...",
    "timestamp": "..."
}
```

Resolution is also recorded:

```json
{
    "type": "rebuttal_resolved",
    "submissionId": "...",
    "resolution": "upheld",
    "editorJustification": "Reviewer 2's methodology objection was not substantiated...",
    "affectedReviews": ["review_id_1"],
    "timestamp": "..."
}
```

### 8.5 Impact on Reviewer Reputation

When a rebuttal is resolved, HTS reputation tokens are minted:
- **Rebuttal upheld** (reviewer was wrong): Negative token for the reviewer whose objection was overturned
- **Rebuttal rejected** (reviewer was right): Positive token for the reviewer
- **Partial** (some points upheld, some rejected): Mixed tokens per point

This creates a powerful incentive: reviewers who make well-supported critiques are rewarded; reviewers who make baseless objections are penalized — even after the fact.

---

## 9. Timeline Enforcement

### 9.1 Overview

Journals commit to review timelines on-chain. Delays are tracked and affect journal reputation scores. Authors receive real-time status updates.

### 9.2 Timeline Events

| Event | Deadline | Tracked On |
|---|---|---|
| Editor assigns reviewers | Within 7 days of submission | DB + HCS |
| Reviewer accepts/declines assignment | Within 3 days of assignment | DB |
| Review submission | Within 21 days of acceptance (configurable) | DB + HCS |
| Editorial decision | Within 7 days of all reviews completed | DB + HCS |
| Rebuttal response (if triggered) | Within 14 days of rebuttal opening | DB + HCS |
| Rebuttal resolution | Within 7 days of rebuttal submission | DB + HCS |

### 9.3 What Happens When Deadlines Pass

**Reviewer deadline exceeded:**
- Automatic notification to editor
- Reviewer flagged as late in the system
- `review_late` HTS reputation token minted (negative)
- Editor can reassign to another reviewer

**Editor deadline exceeded:**
- Author notified: "Your paper's decision is overdue"
- Journal's timeline adherence score drops
- Public visibility: late decisions are flagged on the journal's profile

**Rebuttal deadline exceeded:**
- Rebuttal phase closes automatically
- Editor proceeds with decision based on available reviews
- Author notified: "Rebuttal window has closed"

### 9.4 Journal Timeline Reputation

Each journal has a timeline performance score computed from:
- Average time from submission to first reviewer assigned
- Average time from assignment to review completion
- Average time from reviews complete to decision
- Percentage of reviews completed on time
- Percentage of decisions made on time

This score is publicly visible. Researchers can factor it into their journal selection.

### 9.5 Smart Contract Enforcement (Stretch Goal)

For stronger enforcement, deadlines can be managed via a Hedera smart contract:

```solidity
contract TimelineEnforcer {
    struct Deadline {
        bytes32 submissionHash;
        uint256 deadline;
        address responsible;       // Reviewer or editor wallet
        bool completed;
    }

    mapping(bytes32 => Deadline[]) public deadlines;

    function registerDeadline(
        bytes32 submissionHash,
        uint256 deadline,
        address responsible
    ) external onlyPlatform { ... }

    function checkDeadline(bytes32 submissionHash, uint256 index)
        external view returns (bool isOverdue)
    {
        Deadline storage d = deadlines[submissionHash][index];
        return !d.completed && block.timestamp > d.deadline;
    }
}
```

This is a stretch goal for the hackathon. The MVP uses off-chain deadline tracking with HCS anchoring.

---

## 10. Off-Chain Storage Architecture

### 10.1 Strategy

IPFS via web3.storage (pinning + Filecoin archival) with content-addressed storage. Non-public files are Lit-encrypted. Files are referenced by CID (Content Identifier) in the database.

```
IPFS naming convention:
papers/{sha256hash}               # Lit-encrypted (draft + under review) or plaintext
datasets/{sha256hash}             # Lit-encrypted datasets
environments/{sha256hash}         # Environment specs

Each file is pinned on IPFS and archived to Filecoin via web3.storage.
Retrieval via w3s.link gateway: https://w3s.link/ipfs/{cid}
```

### 10.2 Upload Flow

1. Client computes SHA-256 of original file
2. Client encrypts via Lit SDK with access conditions
3. Client POSTs encrypted file as FormData to `/api/upload/ipfs`
4. API pins file to IPFS via web3.storage w3up client, returns CID
5. API stores: original hash, Lit metadata, CID (as `fileStorageKey`)
6. On-chain: hash of ORIGINAL file is recorded on HCS

---

## 11. Database Schema Design

PostgreSQL (Neon prod) / SQLite (dev) via Drizzle ORM.

### 11.1 Core Tables

```sql
-- ============================================================
-- IDENTITY
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY,
    wallet_address  TEXT UNIQUE NOT NULL,
    display_name    TEXT,
    institution     TEXT,
    bio             TEXT,
    orcid_id        TEXT,                            -- Format-validated only for now
    roles           TEXT[] DEFAULT '{}',              -- ['author','reviewer','editor']
    research_fields TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PAPERS
-- ============================================================
CREATE TABLE papers (
    id              UUID PRIMARY KEY,
    title           TEXT NOT NULL,
    abstract        TEXT,
    status          TEXT NOT NULL DEFAULT 'draft',
    -- draft → registered → contract_pending → submitted →
    -- under_review → rebuttal_open → revision_requested →
    -- published → retracted
    visibility      TEXT NOT NULL DEFAULT 'private',
    current_version INT NOT NULL DEFAULT 1,
    owner_wallet    TEXT NOT NULL REFERENCES users(wallet_address),
    journal_id      UUID REFERENCES journals(id),
    contract_id     UUID REFERENCES authorship_contracts(id),
    study_type      TEXT DEFAULT 'original',
    -- 'original' | 'negative_result' | 'replication' |
    -- 'replication_failed' | 'meta_analysis'
    replication_of_hash TEXT,                         -- If replication, link to original
    replication_of_doi  TEXT,
    research_fields TEXT[] DEFAULT '{}',
    -- Lit Protocol
    lit_condition_id  TEXT,
    lit_encrypted_key TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE paper_versions (
    id                  UUID PRIMARY KEY,
    paper_id            UUID NOT NULL REFERENCES papers(id),
    version_number      INT NOT NULL,
    paper_hash          TEXT NOT NULL,                -- SHA-256 of ORIGINAL file
    dataset_hash        TEXT,
    dataset_url         TEXT,
    code_commit_hash    TEXT,
    code_repo_url       TEXT,
    environment_hash    TEXT,
    file_storage_key    TEXT,                         -- IPFS CID
    hedera_tx_id        TEXT,
    hedera_timestamp    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(paper_id, version_number)
);

-- ============================================================
-- AUTHORSHIP CONTRACTS
-- ============================================================
CREATE TABLE authorship_contracts (
    id              UUID PRIMARY KEY,
    paper_id        UUID REFERENCES papers(id),
    paper_title     TEXT,
    contract_hash   TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    -- 'pending' | 'partially_signed' | 'fully_signed' | 'superseded'
    version         INT NOT NULL DEFAULT 1,
    creator_wallet  TEXT NOT NULL REFERENCES users(wallet_address),
    hedera_tx_id    TEXT,
    hedera_timestamp TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contract_contributors (
    id                  UUID PRIMARY KEY,
    contract_id         UUID NOT NULL REFERENCES authorship_contracts(id),
    contributor_wallet  TEXT,
    contributor_orcid   TEXT,
    contributor_name    TEXT,
    contribution_pct    DECIMAL(5,2) NOT NULL,
    role_description    TEXT,
    signature           TEXT,
    signature_tx_id     TEXT,
    signed_at           TIMESTAMPTZ,
    status              TEXT DEFAULT 'pending',
    invite_token        TEXT UNIQUE,
    invite_expires_at   TIMESTAMPTZ,
    display_order       INT NOT NULL
);

-- ============================================================
-- JOURNALS
-- ============================================================
CREATE TABLE journals (
    id              UUID PRIMARY KEY,
    name            TEXT NOT NULL,
    issn            TEXT,
    editor_wallet   TEXT NOT NULL REFERENCES users(wallet_address),
    reputation_score DECIMAL(3,2) DEFAULT 0,
    timeline_score  DECIMAL(3,2) DEFAULT 0,          -- Timeline adherence
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SUBMISSIONS & REVIEW PIPELINE
-- ============================================================
CREATE TABLE submissions (
    id              UUID PRIMARY KEY,
    paper_id        UUID NOT NULL REFERENCES papers(id),
    journal_id      UUID NOT NULL REFERENCES journals(id),
    version_id      UUID NOT NULL REFERENCES paper_versions(id),
    contract_id     UUID NOT NULL REFERENCES authorship_contracts(id),
    status          TEXT NOT NULL DEFAULT 'submitted',
    -- 'submitted' | 'viewed_by_editor' | 'criteria_published' | 'reviewers_assigned' |
    -- 'under_review' | 'reviews_completed' | 'rebuttal_open' |
    -- 'decision_pending' | 'published' | 'rejected' | 'revision_requested'
    author_response_status TEXT,      -- 'pending' | 'accepted' | 'rebuttal_requested'
    author_response_at     TIMESTAMPTZ,
    author_response_tx_id  TEXT,
    criteria_hash   TEXT,
    criteria_tx_id  TEXT,
    decision        TEXT,                             -- 'accept' | 'reject' | 'revise'
    decision_justification TEXT,
    decision_tx_id  TEXT,
    all_criteria_met BOOLEAN,
    review_deadline_days INT DEFAULT 21,
    submitted_at    TIMESTAMPTZ DEFAULT now(),
    decided_at      TIMESTAMPTZ
);

CREATE TABLE review_criteria (
    id              UUID PRIMARY KEY,
    submission_id   UUID NOT NULL REFERENCES submissions(id),
    criteria_json   JSONB NOT NULL,
    criteria_hash   TEXT NOT NULL,
    hedera_tx_id    TEXT,
    published_at    TIMESTAMPTZ
);

CREATE TABLE review_assignments (
    id              UUID PRIMARY KEY,
    submission_id   UUID NOT NULL REFERENCES submissions(id),
    reviewer_wallet TEXT NOT NULL REFERENCES users(wallet_address),
    status          TEXT DEFAULT 'assigned',
    -- 'assigned' | 'accepted' | 'declined' | 'in_progress' |
    -- 'submitted' | 'late'
    assigned_at     TIMESTAMPTZ DEFAULT now(),
    deadline        TIMESTAMPTZ NOT NULL,
    accepted_at     TIMESTAMPTZ,
    submitted_at    TIMESTAMPTZ
);

CREATE TABLE reviews (
    id                  UUID PRIMARY KEY,
    submission_id       UUID NOT NULL REFERENCES submissions(id),
    assignment_id       UUID NOT NULL REFERENCES review_assignments(id),
    reviewer_wallet     TEXT NOT NULL REFERENCES users(wallet_address),
    review_hash         TEXT,
    criteria_evaluations JSONB,                     -- Per-criterion: rating + comment
    strengths           TEXT,
    weaknesses          TEXT,
    questions           TEXT,
    confidential_comments TEXT,                     -- NEVER on-chain
    recommendation      TEXT,                       -- 'accept' | 'minor' | 'major' | 'reject'
    hedera_tx_id        TEXT,
    reputation_token_serial INT,                    -- HTS token minted on submission
    submitted_at        TIMESTAMPTZ
);

-- ============================================================
-- REBUTTALS
-- ============================================================
CREATE TABLE rebuttals (
    id              UUID PRIMARY KEY,
    submission_id   UUID NOT NULL REFERENCES submissions(id),
    author_wallet   TEXT NOT NULL,
    status          TEXT DEFAULT 'open',
    -- 'open' | 'submitted' | 'under_review' | 'resolved'
    deadline        TIMESTAMPTZ NOT NULL,
    rebuttal_hash   TEXT,
    hedera_tx_id    TEXT,
    resolution      TEXT,                            -- 'upheld' | 'rejected' | 'partial'
    editor_notes    TEXT,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rebuttal_responses (
    id              UUID PRIMARY KEY,
    rebuttal_id     UUID NOT NULL REFERENCES rebuttals(id),
    review_id       UUID NOT NULL REFERENCES reviews(id),
    criterion_id    TEXT,                             -- Optional: specific criterion
    position        TEXT NOT NULL,                    -- 'agree' | 'disagree'
    justification   TEXT NOT NULL,
    evidence        TEXT
);

-- ============================================================
-- REVIEWER RATINGS (anonymous)
-- ============================================================
CREATE TABLE reviewer_ratings (
    id              UUID PRIMARY KEY,
    review_id       UUID NOT NULL REFERENCES reviews(id) UNIQUE,
    -- 5-protocol ratings (each 1-5)
    actionable_feedback     INT NOT NULL CHECK (actionable_feedback BETWEEN 1 AND 5),
    deep_engagement         INT NOT NULL CHECK (deep_engagement BETWEEN 1 AND 5),
    fair_objective          INT NOT NULL CHECK (fair_objective BETWEEN 1 AND 5),
    justified_recommendation INT NOT NULL CHECK (justified_recommendation BETWEEN 1 AND 5),
    appropriate_expertise   INT NOT NULL CHECK (appropriate_expertise BETWEEN 1 AND 5),
    overall_rating          INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    -- Optional anonymous comment
    comment         TEXT,
    comment_hash    TEXT,
    -- NO author reference — anonymity by design (FR-6.3)
    rating_hash     TEXT,
    reputation_token_serial TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- REPUTATION (append-only)
-- ============================================================
CREATE TABLE reputation_events (
    id              UUID PRIMARY KEY,
    user_wallet     TEXT NOT NULL REFERENCES users(wallet_address),
    event_type      TEXT NOT NULL,
    score_delta     DECIMAL(5,2),
    details         JSONB,
    hts_token_serial INT,
    hedera_tx_id    TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reputation_scores (
    user_wallet         TEXT PRIMARY KEY REFERENCES users(wallet_address),
    overall_score       DECIMAL(5,2) DEFAULT 0,
    timeliness_score    DECIMAL(5,2) DEFAULT 0,
    editor_rating_avg   DECIMAL(5,2) DEFAULT 0,
    author_rating_avg   DECIMAL(5,2) DEFAULT 0,
    publication_score   DECIMAL(5,2) DEFAULT 0,
    review_count        INT DEFAULT 0,
    last_computed_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS & ACTIVITY
-- ============================================================
CREATE TABLE notifications (
    id              UUID PRIMARY KEY,
    user_wallet     TEXT NOT NULL,
    type            TEXT NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT,
    link            TEXT,
    is_read         BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE activity_log (
    id              UUID PRIMARY KEY,
    user_wallet     TEXT NOT NULL,
    paper_id        UUID REFERENCES papers(id),
    action          TEXT NOT NULL,
    details         JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 11.2 Key Indexes

```sql
CREATE INDEX idx_papers_owner ON papers(owner_wallet);
CREATE INDEX idx_papers_status ON papers(status);
CREATE INDEX idx_submissions_journal ON submissions(journal_id, status);
CREATE INDEX idx_review_assignments_reviewer ON review_assignments(reviewer_wallet, status);
CREATE INDEX idx_review_assignments_deadline ON review_assignments(deadline) WHERE status != 'submitted';
CREATE INDEX idx_reviews_submission ON reviews(submission_id);
CREATE INDEX idx_rebuttals_submission ON rebuttals(submission_id);
CREATE INDEX idx_reputation_events_wallet ON reputation_events(user_wallet, created_at);
CREATE INDEX idx_notifications_user ON notifications(user_wallet, is_read, created_at);
CREATE INDEX idx_papers_search ON papers USING gin(
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(abstract,''))
);
```

---

## 12. API Design

### 12.1 Route Structure

```
app/api/
├── auth/
│   ├── me/route.ts                    # GET: current user ✅
│   └── ...                            # Login/logout via Thirdweb ✅
├── papers/
│   ├── route.ts                       # GET/POST ✅
│   ├── public/route.ts                # GET (no auth) ✅
│   └── [id]/
│       ├── route.ts                   # GET/PATCH ✅
│       ├── versions/route.ts          # POST ✅
│       └── submit/route.ts            # POST ✅
├── contracts/
│   ├── route.ts                       # GET/POST ✅
│   └── [id]/
│       ├── route.ts                   # GET/PATCH ✅
│       ├── contributors/route.ts      # POST ✅
│       ├── sign/route.ts              # POST → HCS ✅
│       ├── invite/route.ts            # POST 🔲
│       └── reset-signatures/route.ts  # PATCH ✅
├── submissions/
│   └── [id]/
│       ├── criteria/route.ts          # POST: publish criteria → HCS ✅
│       ├── assign-reviewer/route.ts   # POST ✅
│       ├── accept-assignment/route.ts # POST: reviewer accepts/declines → auto under_review ✅
│       ├── view/route.ts             # POST: editor views → viewed_by_editor → HCS ✅
│       ├── author-response/route.ts   # POST: researcher accepts/requests rebuttal → HCS ✅
│       ├── open-rebuttal/route.ts     # POST: DEPRECATED (returns 410 Gone) ✅
│       └── decision/route.ts          # POST: accept/reject → HCS ✅
├── reviews/
│   ├── route.ts                       # GET: reviewer's assigned reviews ✅
│   ├── [id]/route.ts                  # GET/POST: review detail / submit → HCS ✅
│   └── [id]/rate/route.ts             # POST: 5-protocol rating + comment → HCS ✅
├── rebuttals/
│   ├── [rebuttalId]/respond/route.ts  # POST: author responds per-review ✅
│   └── [rebuttalId]/resolve/route.ts  # POST: editor resolves ✅
├── journals/
│   └── route.ts                       # GET: list journals ✅
├── notifications/route.ts             # GET/PATCH: list + mark read ✅
├── verify/route.ts                    # POST: hash verification (no auth) ✅
├── upload/
│   └── ipfs/route.ts                 # POST ✅
├── activity/route.ts                  # GET ✅
└── cron/
    └── deadlines/route.ts             # Check review deadlines ✅
```

### 12.2 Key New API Contracts

**Publish Review Criteria (POST /api/submissions/:id/criteria)**
```typescript
// Request
{
    criteria: Array<{
        label: string;
        evaluationType: 'yes_no_partially' | 'scale_1_5';
        description?: string;
        required: boolean;
    }>;
}
// Response
{ criteriaHash: string; hederaTxId: string; }
```

**Submit Review (POST /api/reviews/:id)**
```typescript
// Request
{
    criteriaEvaluations: Array<{
        criterionId: string;
        rating: string;          // 'yes' | 'no' | 'partially' or 1-5
        comment?: string;        // Required if 'no' or 'partially'
    }>;
    strengths: string;
    weaknesses: string;
    questions: string;
    confidentialComments?: string;
    recommendation: 'accept' | 'minor' | 'major' | 'reject';
    reviewHash: string;
}
// Response
{ hederaTxId: string; reputationTokenSerial: number; }
```

**Submit Rebuttal (POST /api/rebuttals/:submissionId)**
```typescript
// Request
{
    responses: Array<{
        reviewId: string;
        criterionId?: string;
        position: 'agree' | 'disagree';
        justification: string;
        evidence?: string;
    }>;
    rebuttalHash: string;
}
// Response
{ hederaTxId: string; deadline: string; }
```

**Resolve Rebuttal (POST /api/rebuttals/:submissionId/resolve)**
```typescript
// Request
{
    resolution: 'upheld' | 'rejected' | 'partial';
    editorNotes: string;
    affectedReviews: Array<{
        reviewId: string;
        outcome: 'upheld' | 'rejected';
    }>;
}
// Response
{ hederaTxId: string; reputationTokensMinted: number; }
```

**Search Reviewers (GET /api/journals/:id/reviewers)**
```typescript
// Query params: ?field=computer_science&minScore=3.5&minReviews=5
// Response
{
    reviewers: Array<{
        wallet: string;
        displayName: string;
        overallScore: number;
        timelinessScore: number;
        reviewCount: number;
        researchFields: string[];
    }>;
}
```

---

## 13. Authentication & Identity Architecture

### 13.1 Current Implementation

Thirdweb v5 handles wallet connection. `UserContext.tsx` provides `useUser()` hook. `auth.ts` issues JWTs stored as httpOnly cookies.

Wallet address is the primary identifier. All API routes derive identity from the verified JWT, never from request body.

### 13.2 Identity Stack

```
┌─────────────────────────────────┐
│         ORCID (planned v2)      │
├─────────────────────────────────┤
│    HTS Tokens (Reputation)      │  ← Soulbound NFTs on Hedera
├─────────────────────────────────┤
│  Wallet (Thirdweb v5)           │  ← Authentication primitive
└─────────────────────────────────┘
```

---

## 14. Frontend Architecture

### 14.1 Page Structure

```
src/app/
├── page.tsx                       # Landing page
├── login/page.tsx                 # Wallet connect
├── onboarding/page.tsx            # Role selection + ORCID (placeholder)
├── verify/page.tsx                # Public paper verification tool ✅
├── (protected)/
│   ├── researcher/
│   │   ├── page.tsx                   # Researcher dashboard ✅
│   │   ├── authorship-contracts/page.tsx # Authorship contracts (build + sign + manage) ✅
│   │   ├── paper-version-control/page.tsx # Paper registration + version management ✅
│   │   ├── create-submission/page.tsx # Create submission ✅
│   │   ├── view-submissions/page.tsx  # View submissions ✅
│   │   ├── review-response/[submissionId]/page.tsx # Review response + rating ✅
│   │   └── rebuttal/[submissionId]/page.tsx # Rebuttal workspace ✅
│   ├── editor/
│   │   ├── page.tsx                   # Editor dashboard (stats + carousel) ✅ DB-backed
│   │   ├── incoming/page.tsx          # Incoming papers (three-column: list → PDF → criteria/assign/reject) ✅ DB-backed
│   │   ├── under-review/page.tsx      # Under review (three-column: list → PDF → status/decision/rebuttal) ✅ DB-backed
│   │   ├── accepted/page.tsx          # Accepted papers (three-column: list → PDF → comments/issues) ✅ DB-backed
│   │   └── management/page.tsx        # Journal management (aims/scope, issues, reviewer pool) ✅ DB-backed
│   └── reviewer/
│       ├── page.tsx                   # Reviewer dashboard (assigned reviews + reputation) 🔲 mock
│       └── review_workspace/[id]/page.tsx # Review workspace ✅
```

### 14.2 Key Components (Implemented)

```
features/editor/
├── CriteriaBuilder.tsx            # Editor defines review criteria (sidebar panel) ✅
├── incoming-papers.client.tsx     # Three-column: paper list → PDF → criteria/assign/reject ✅
├── under-review.client.tsx        # Three-column: paper list → PDF → status/decision/rebuttal ✅
├── accepted-papers.client.tsx     # Three-column: paper list → PDF → comments/issues ✅
├── journal-management.client.tsx  # Journal settings, issues, reviewer pool ✅
├── components/sidebar/
│   ├── AssignReviewersPanel.tsx    # Search + assign reviewers with reputation scores ✅
│   ├── ReviewStatusPanel.tsx      # Reviewer assignment + review status ✅
│   ├── ReviewCommentsPanel.tsx    # Anonymized review comments display ✅
│   ├── FinalDecisionPanel.tsx     # Accept/reject/revise with justification ✅
│   ├── DeskRejectPanel.tsx        # Quick reject from incoming ✅
│   ├── ResolveRebuttalPanel.tsx   # Resolve rebuttal with reputation impact ✅
│   └── AddToIssuePanel.tsx        # Add paper to journal issue ✅
├── components/management/
│   ├── EditableSection.tsx        # Editable aims/scope + submission criteria ✅
│   ├── IssuesGrid.tsx             # Grid of journal issues ✅
│   └── ReviewerGrid.tsx           # Grid of assigned reviewers with search/filter ✅

features/rebuttals/
├── components/                    # Rebuttal response form + resolution UI ✅

features/reviews/
├── queries.ts + actions.ts        # Review DB operations ✅
├── timeline/
│   ├── SubmissionTimeline.tsx     # Visual timeline of review process
│   ├── DeadlineIndicator.tsx      # Urgency badges
│   └── StatusUpdates.tsx          # Real-time notification feed
```

---

## 15. Data Flow Diagrams

### 15.1 Full Review Lifecycle

```
Author                  Journal Editor           Reviewer              Hedera
  │                         │                       │                    │
  │ Submit paper ──────────►│                       │                    │
  │                         │── HCS submission ────────────────────────►│
  │                         │                       │                    │
  │                         │ Publish criteria      │                    │
  │                         │── HCS criteria ──────────────────────────►│
  │                         │                       │                    │
  │                         │ Assign reviewers      │                    │
  │                         │ (search by reputation) │                   │
  │                         │──────────────────────►│                    │
  │                         │                       │                    │
  │ ◄─ "Reviewers assigned" │                       │                    │
  │                         │                       │                    │
  │                         │                 Review paper               │
  │                         │                 Evaluate criteria           │
  │                         │              ◄────── Submit review          │
  │                         │                       │── HCS review ─────►│
  │                         │                       │── HTS mint ───────►│
  │                         │                       │   (reputation)     │
  │ ◄─ "Review 1/3 done"   │                       │                    │
  │                         │                       │                    │
  │                         │ All reviews in        │                    │
  │                         │                       │                    │
  │                         │── Criteria met? ─────────────────────────►│
  │                         │                       │                    │
  │ IF criteria met:        │                       │                    │
  │ ◄─ "Paper accepted" ───│── HCS decision ──────────────────────────►│
  │                         │                       │                    │
  │ IF criteria NOT met:    │                       │                    │
  │ ◄─ "Rebuttal phase     │                       │                    │
  │     open (14 days)"     │                       │                    │
  │                         │                       │                    │
  │ Submit rebuttal ───────►│                       │                    │
  │                         │── HCS rebuttal ──────────────────────────►│
  │                         │                       │                    │
  │                         │ Resolve rebuttal      │                    │
  │                         │── HCS resolution ────────────────────────►│
  │                         │── HTS mint (reputation adjustment) ──────►│
  │                         │                       │                    │
  │ ◄─ Final decision ─────│                       │                    │
```

### 15.2 Paper Registration (Current Implementation)

```
Author                     Lit Network       API           Hedera      IPFS
  │                            │               │              │          │
  │ Fill details, upload PDF   │               │              │          │
  │ hashFile(pdf) → paperHash  │               │              │          │
  │ Select study type          │               │              │          │
  │                            │               │              │          │
  │ Create Lit condition ─────►│               │              │          │
  │ ◄── encryption key ────────│               │              │          │
  │ Encrypt PDF client-side    │               │              │          │
  │                            │               │              │          │
  │ POST /api/upload/ipfs (FormData) ─────────►│              │          │
  │                            │               │── pin file ──┼─────────►│
  │ ◄── { cid } ──────────────────────────────│              │          │
  │                            │               │              │          │
  │ POST /api/papers ─────────────────────────►│              │          │
  │  { paperHash, litMeta,     │               │── HCS msg ──►│          │
  │    studyType, ... }        │               │◄── receipt ──│          │
  │ ◄── { paperId, txId } ────────────────────│              │          │
```

---

## 16. Deployment Architecture

### 16.1 Vercel Configuration

```
Vercel Project
├── Framework: Next.js 15 (App Router, Turbopack)
├── Runtime: Node.js (NOT Edge)
├── Environment Variables:
│   ├── NEXT_PUBLIC_THIRDWEB_CLIENT_ID, AUTH_PRIVATE_KEY
│   ├── DATABASE_URL (Neon)
│   ├── HEDERA_NETWORK, HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY
│   ├── HCS_TOPIC_* (7 topics)
│   ├── HTS_REPUTATION_TOKEN_ID
│   ├── W3_PRINCIPAL_KEY, W3_DELEGATION_PROOF
│   ├── NEXT_PUBLIC_LIT_NETWORK
│   └── UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
├── Cron Jobs:
│   ├── /api/cron/reputation     # Recompute + mint HTS (hourly)
│   └── /api/cron/deadlines      # Review deadline checks (hourly)
```

---

## 17. Security Architecture

| Threat | Mitigation |
|---|---|
| **Paper content leak during review** | Lit-encrypted on IPFS. Only authorized wallets can decrypt. |
| **Wallet impersonation** | Thirdweb signature verification. JWT derived from verified wallet. |
| **Hash tampering** | Client-side hashing. On-chain hash is source of truth. |
| **Contract modification after signing** | Signature invalidation + re-signing required. Previous versions on-chain. |
| **Reviewer identity exposure** | Reviews linked to wallet, not real name. Author ratings have no rater ID. |
| **Criteria changed after publication** | HCS record is immutable. Criteria hash verified against on-chain record. |
| **Rebuttal manipulation** | Rebuttal hashed and anchored on HCS before editor review. |
| **Timeline data manipulation** | All deadline events anchored on HCS with timestamps. |
| **Reputation gaming** | Soulbound tokens — non-transferable. Append-only history. |

---

## 18. Future Roadmap

### Phase 2: Enhanced Identity & Access

- Full ORCID OAuth integration (currently placeholder)
- `did:hedera` for decentralized identity documents
- Lit Protocol condition updates using ORCID verification
- Sybil-resistant reviewer identity (FR-5.5)

### Phase 3: Financial Restructuring

- **x402 micropayment paper access** — readers pay $0.50–$2.00 per paper
- **Automatic revenue splitting** — 70% authors, 15% reviewers, 10% journal, 5% platform
- Revenue splitter smart contract on Hedera EVM
- Payment receipt registry for Lit-based access control
- Funder escrow for open access subsidies
- Reviewer incentive payments from journals via x402

**Why Phase 3:** This is the ideal end state but requires critical mass of journals and researchers first. Once Axiom is the standard for review integrity, the financial restructuring becomes a natural next step — journals will adopt it because researchers demand it, not because we force it.

### Phase 4: Advanced Features

- AI-generated review detection (FR-11)
- Scientific fraud insurance markets (FR-9)
- Commercial IP tagging (FR-10)
- Post-publication commentary system
- Cross-platform interoperability (verify external papers)
- Retraction management (FR-7, write operations)

---

## 19. Open Questions & Risks

### 19.1 Open Decisions

| # | Question | Recommendation |
|---|---|---|
| 1 | **Lit + Hedera chain support** | Test EVM-compatible conditions via Hedera JSON-RPC. Highest technical risk. |
| 2 | **HTS soulbound enforcement** | Prohibitive custom fee or admin-only transfer. Test early. |
| 3 | **Review comment visibility timing** | Public only after final decision (including rebuttal resolution). |
| 4 | **Rebuttal deadline** | 14 days. Configurable per journal in v2. |
| 5 | **Criteria format** | Start with yes/no/partially. Scale 1–5 as option. |
| 6 | **Timeline enforcement: on-chain or off-chain?** | Off-chain (DB + cron) for MVP. Smart contract as stretch goal. |

### 19.2 Key Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Lit + Hedera compatibility** | Core feature blocked | Test in week 1. Fallback: server-side access control. |
| **HTS token minting costs at scale** | Budget overrun | ~$0.05/mint. Budget for 1000 mints during hackathon. |
| **Rebuttal abuse** | Authors rebut everything | Editor has final authority. Frivolous rebuttals waste author's reputation. |
| **Journal reluctance to publish criteria** | Adoption blocked | Start with progressive journals. Criteria can be broad. |
| **Canonical JSON across wallets** | Broken signatures | Use `json-canonicalize` (RFC 8785). Test with Thirdweb. |
| **Hackathon timeline** | Can't finish | Priority: (1) Journal dashboard + review pipeline, (2) HTS reputation, (3) Rebuttal, (4) Lit decrypt, (5) Verify page. |

---

## Appendix A: Hedera Service Usage

| Service | How We Use It | Hackathon Concepts |
|---|---|---|
| **HCS** | 7 domain topics for immutable audit logs | Consensus messaging |
| **HTS** | Soulbound reviewer reputation NFTs | Token creation, NFT minting, non-transferability |
| **Smart Contracts** | Timeline enforcement (stretch) | Solidity on Hedera EVM |
| **System Contracts** | Mint HTS from Solidity (stretch) | Hybrid HTS + EVM |
| **DID** | User identity (wallet-based for MVP) | Decentralized identity |
| **Mirror Node** | Query tokens, verify transactions | Off-chain reads |

## Appendix B: Feature Scope

**Core MVP (Peer Review Quality & Accountability):**
- ✅ Authorship contribution contracts (FR-1)
- ✅ Paper registration & timestamped ownership (FR-2)
- ✅ Paper versioning & provenance (FR-3)
- ✅ Structured per-criterion reviewer feedback + pre-registered criteria (FR-4)
- ✅ Reviewer reputation via HTS (FR-5)
- ✅ Reviewer feedback transparency (FR-6)
- ✅ Rebuttal phase
- ✅ Timeline enforcement (cron-based)
- ✅ Real-time author status updates (DB-backed notifications)
- ✅ Negative result / replication tagging
- ✅ External paper verification tool

**Stretch Goals:**
- Timeline enforcement via smart contract
- HTS minting via System Contracts (hybrid approach)
- Full Lit decrypt wired into UI

**Future Roadmap (NOT in hackathon):**
- x402 micropayment paper access
- Revenue splitting (70/15/10/5)
- ORCID OAuth
- Funder escrow for open access
- AI review detection
- Fraud insurance