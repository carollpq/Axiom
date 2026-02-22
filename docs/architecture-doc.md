# Architecture Design Document v2
## Blockchain-Backed Research Publishing & Peer Review Platform

**Version:** 2.0  
**Stack:** Next.js · Hedera (HCS + HTS + DID) · x402 · Lit Protocol · Vercel  
**Date:** February 2026  
**Hackathon:** Hedera Hello Future: Apex

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Financial Architecture — Dismantling the Journal Monopoly](#2-financial-architecture)
3. [High-Level System Architecture](#3-high-level-system-architecture)
4. [Hedera Integration Architecture](#4-hedera-integration-architecture)
5. [x402 Micropayment Integration](#5-x402-micropayment-integration)
6. [HTS Soulbound Reputation Tokens](#6-hts-soulbound-reputation-tokens)
7. [Lit Protocol — Decentralized Access Control](#7-lit-protocol--decentralized-access-control)
8. [Off-Chain Storage Architecture](#8-off-chain-storage-architecture)
9. [Database Schema Design](#9-database-schema-design)
10. [API Design](#10-api-design)
11. [Authentication & Identity Architecture](#11-authentication--identity-architecture)
12. [Frontend Architecture](#12-frontend-architecture)
13. [Data Flow Diagrams](#13-data-flow-diagrams)
14. [Deployment Architecture](#14-deployment-architecture)
15. [Security Architecture](#15-security-architecture)
16. [Scalability Considerations](#16-scalability-considerations)
17. [Open Questions & Risks](#17-open-questions--risks)

---

## 1. Architecture Overview

### Design Principles

- **Hash-on-chain, content-off-chain.** No paper content, review text, or PII on Hedera. Only hashes and metadata references. Satisfies NFR-2 (security) and NFR-4 (privacy/GDPR).
- **Client-side hashing.** All SHA-256 hashes computed in-browser via Web Crypto API before anything leaves the client (PS-11).
- **Wallet-first authentication.** No passwords. Identity flows through wallet → DID → ORCID.
- **Append-only integrity.** On-chain records are immutable. Off-chain records that mirror on-chain state are append-only.
- **Role-based access, not role-based identity.** A single DID can hold Author, Reviewer, and Editor roles simultaneously.
- **Authors and reviewers get paid, not just journals.** x402 micropayments auto-split revenue to all contributors. The financial model is a core architectural concern, not a feature.
- **Decentralized access control.** Paper privacy is enforced cryptographically via Lit Protocol, not by trusting the server.
- **Portable, on-chain reputation.** Reviewer reputation lives as soulbound HTS tokens, owned by the reviewer, not any journal.

### System Boundaries

```
┌──────────────────────────────────────────────────────────────┐
│                       BROWSER CLIENT                          │
│  Next.js App · Wallet SDKs · Client-side Hashing              │
│  Lit SDK (encrypt/decrypt) · x402 Client (pay for access)     │
└───────┬──────────────────────┬───────────────┬───────────────┘
        │ HTTPS (API Routes)   │ Wallet Signing │ Lit Network
        ▼                      ▼               ▼
┌────────────────────┐  ┌──────────────┐  ┌──────────────────┐
│  NEXT.JS API LAYER │  │    HEDERA     │  │  LIT PROTOCOL    │
│  (Vercel Serverless)│  │   NETWORK    │  │   NETWORK        │
│                    │  │              │  │                  │
│  Business Logic    │  │  HCS Topics  │  │  Threshold MPC   │
│  x402 Middleware   │  │  HTS Tokens  │  │  Access Control   │
│  Off-chain CRUD    │  │  DID Service │  │  Encrypt/Decrypt  │
│  Revenue Splitting │  │  x402 Settle │  │                  │
└────────┬───────────┘  └──────────────┘  └──────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                   OFF-CHAIN DATA LAYER                         │
│  PostgreSQL (structured) · Cloudflare R2 (encrypted files)     │
│  Upstash Redis (cache, rate limiting)                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Financial Architecture — Dismantling the Journal Monopoly

### The Problem We're Solving

In traditional academic publishing:
- Authors do the research (often publicly funded) and get $0 from publications
- Reviewers provide quality control for free
- Journals charge $3,000–$11,000 in Article Processing Charges (APCs) to authors
- Journals then charge readers $30/article or institutions $10M+/year for access
- Journal profit margins: 30–40% on billions in revenue

**The result:** Public money funds research twice (once for the work, once to read it), while the people who create and validate the work earn nothing from it.

### Our Financial Model

x402 micropayments + on-chain authorship contracts + HTS reputation tokens create a new revenue structure where **value flows to the people who create it.**

#### Revenue Split Per Paper Access

When a reader accesses a paper via x402 micropayment:

```
Reader pays: $0.50 – $2.00 (configurable by authors)
                    │
    ┌───────────────┼───────────────────────────┐
    │               │               │           │
    ▼               ▼               ▼           ▼
  Authors         Reviewers       Journal     Platform
   70%              15%            10%          5%
    │               │
    │               │
    ▼               ▼
  Split per       Split per
  authorship      review
  contract %      assignment
  (on-chain)      (on-chain)
```

#### How Each Party Benefits

**Authors (70% of revenue):**
- Direct income from every paper read — no more $0
- Split enforced by on-chain authorship contract percentages
- Recurring revenue: every new reader, every year
- Can set price to $0 for grant-mandated open access (funder escrow covers the cost)

**Reviewers (15% of revenue):**
- Get paid for review work — no more free labor
- Higher reputation → more review assignments → more earning papers
- Revenue is proportional to how many people read the papers they reviewed
- Creates a genuine quality incentive: better reviews → better papers → more readers → more money

**Journals/Editors (10% of revenue):**
- Earn a fair fee for the coordination service they actually provide
- Down from ~95% of total value capture to 10%
- Good journals attract more authors → more papers → more revenue
- Journal reputation score directly affects competitiveness

**Platform (5% of revenue):**
- Sustainability fee for infrastructure, development, and HCS/HTS costs

#### Access Tiers

| Tier | Content Available | Payment |
|---|---|---|
| **Free** | Abstract, metadata, authorship info, provenance hashes, version history | None |
| **Micropayment** | Full paper PDF, datasets, code links | x402 ($0.50–$2.00) |
| **Institutional** | Bulk pre-authorized access for university members | x402 deposit account |
| **Open Access** | Full paper, author-set price = $0 | Funder escrow covers revenue split |

#### Funder-Subsidized Open Access (v2, architecture-ready)

Instead of paying journals $5,000+ APCs:
1. Funder escrows funds via smart contract
2. Paper is accessible for free to readers (price set to $0)
3. Each access draws from the escrow, paying authors + reviewers at the standard split
4. Funder can verify on-chain exactly where every dollar went
5. When escrow depletes, paper reverts to standard micropayment access

This is architecturally supported by FR-8 (funding-linked timelines). The escrow smart contract pattern is the same — we just extend it to cover access subsidies.

---

## 3. High-Level System Architecture

### Component Map

| Component | Technology | Responsibility |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router) | 10 pages from PRD, wallet integration, client-side hashing, Lit encrypt/decrypt, x402 client |
| **API Layer** | Next.js Route Handlers (Vercel) | Business logic, x402 middleware (paywall), off-chain CRUD, Hedera submission orchestration |
| **Database** | PostgreSQL (Neon) | Users, papers, contracts, reviews, reputation, earnings, notifications |
| **File Storage** | Cloudflare R2 | Lit-encrypted paper PDFs, datasets, environment specs |
| **Blockchain** | Hedera HCS | Immutable anchoring: hashes, signatures, criteria, decisions |
| **Tokens** | Hedera HTS | Soulbound reputation tokens, potential future payment tokens |
| **Identity** | Hedera DID SDK + ORCID OAuth 2.0 | Decentralized identity with academic identity bridge |
| **Payments** | x402 Protocol (Hedera facilitator) | Micropayment paper access, auto-split revenue |
| **Encryption** | Lit Protocol | Decentralized access control, threshold encryption for private content |
| **Wallets** | HashPack SDK + MetaMask (ethers.js/wagmi) | User auth, tx signing, x402 payment signing |
| **Background Jobs** | Vercel Cron / QStash | Reputation recomputation, deadline monitoring, earnings aggregation |
| **Cache** | Upstash Redis | HCS topic caching, session data, rate limiting, x402 payment verification cache |

---

## 4. Hedera Integration Architecture

### 4.1 Services Used

| Hedera Service | Purpose in Research Chain |
|---|---|
| **HCS (Consensus Service)** | Immutable append-only logs: paper registration, contracts, reviews, criteria, decisions |
| **HTS (Token Service)** | Soulbound reputation tokens for reviewers; potential future payment/governance tokens |
| **DID Service** | Decentralized identity creation, resolution, ORCID linking |
| **Smart Contracts (EVM)** | x402 payment settlement, revenue split logic, Hedera System Contract bridge for HTS |
| **Mirror Node** | Querying on-chain data for verification, token balances, transaction history |

### 4.2 HCS Topic Strategy

Domain-scoped HCS topics. Each topic is an ordered, immutable append-only log.

| Topic | Purpose | Message Schema |
|---|---|---|
| `papers` | Draft registrations, version anchoring | `{type, paperHash, authorDid, orcid, provenanceHashes, visibility, accessPrice, timestamp}` |
| `contracts` | Authorship contract recording | `{type, contractHash, signerDid, paperHash, signatures[], contributionSplits[], timestamp}` |
| `submissions` | Paper submissions to journals | `{type, paperHash, contractHash, journalId, timestamp}` |
| `criteria` | Journal review criteria publication | `{type, journalId, submissionId, criteriaHash, criteria[], timestamp}` |
| `reviews` | Review hash anchoring | `{type, reviewHash, reviewerDid, paperHash, criteriaHash, timestamp}` |
| `decisions` | Journal accept/reject decisions | `{type, journalId, paperHash, justification?, criteriaHash, timestamp}` |
| `retractions` | Retraction records | `{type, paperHash, requestingParty, reason, failedComponent, timestamp}` |
| `earnings` | Revenue distribution events | `{type, paperHash, payerDid?, totalAmount, splits[], txHash, timestamp}` |

### 4.3 HCS Message Flow

```
Client (Browser)                    API (Serverless)               Hedera
      │                                   │                           │
      │  1. Compute hash client-side      │                           │
      │  2. Sign hash with wallet         │                           │
      │── POST /api/papers ──────────────►│                           │
      │     { paperHash, signature,       │                           │
      │       provenanceHashes, ... }     │                           │
      │                                   │  3. Validate signature    │
      │                                   │  4. Store off-chain       │
      │                                   │  5. Submit HCS message ──►│
      │                                   │                           │
      │                                   │◄── Receipt { txId, ts } ──│
      │                                   │  6. Update off-chain      │
      │                                   │     record with txId      │
      │◄── { paperId, txId, ts } ─────────│                           │
```

### 4.4 DID Architecture

Using `did:hedera` method:

- **Creation (WC3):** On first wallet connection, generate DID document on Hedera. Contains wallet's public key and (once linked) ORCID hash.
- **Resolution:** Via Hedera mirror node. Any party can resolve DID → public key + ORCID.
- **Updates (WC5):** ORCID linking updates the DID document on-chain.
- **DID-to-Wallet mapping:** DID is deterministically derived from wallet public key → wallet reconnection auto-resolves DID.

### 4.5 Signature Verification

For authorship contracts (FR-1.3):

1. Contract → `canonicalJson()` (RFC 8785) → SHA-256 hash
2. Signer's wallet signs the hash (ED25519 for HashPack, ECDSA for MetaMask)
3. Signature + signer DID + contract hash → HCS message
4. Verification: re-serialize → recompute hash → resolve DID → verify signature

---

## 5. x402 Micropayment Integration

### 5.1 Overview

x402 is an HTTP-native payment protocol. When a client requests a paid resource, the server responds with HTTP 402 containing payment requirements. The client pays and retries with a payment header. A facilitator verifies and settles the payment on-chain.

Research Chain uses x402 to gate full paper access, with payments auto-split to authors, reviewers, and the journal.

### 5.2 Architecture

```
Reader (Browser)           Research Chain API          x402 Facilitator        Hedera
     │                           │                         │                     │
     │  GET /api/papers/         │                         │                     │
     │      {id}/content         │                         │                     │
     │──────────────────────────►│                         │                     │
     │                           │                         │                     │
     │  HTTP 402 Payment Required│                         │                     │
     │  Headers:                 │                         │                     │
     │   PAYMENT-REQUIRED: {     │                         │                     │
     │     amount: "1.00",       │                         │                     │
     │     currency: "USDC",     │                         │                     │
     │     network: "hedera",    │                         │                     │
     │     receiver: <split      │                         │                     │
     │       contract addr>,     │                         │                     │
     │     facilitator: <url>    │                         │                     │
     │   }                       │                         │                     │
     │◄──────────────────────────│                         │                     │
     │                           │                         │                     │
     │  Wallet signs payment     │                         │                     │
     │  authorization for $1.00  │                         │                     │
     │                           │                         │                     │
     │  GET /api/papers/{id}/    │                         │                     │
     │      content              │                         │                     │
     │  + X-PAYMENT header       │                         │                     │
     │──────────────────────────►│                         │                     │
     │                           │                         │                     │
     │                           │  POST /verify           │                     │
     │                           │  { payment payload }    │                     │
     │                           │────────────────────────►│                     │
     │                           │                         │                     │
     │                           │                         │  Settle on-chain ──►│
     │                           │                         │  (transfer USDC)    │
     │                           │                         │                     │
     │                           │◄── { verified: true } ──│                     │
     │                           │                         │                     │
     │                           │  Trigger revenue split  │                     │
     │                           │  (smart contract call) ─┼─────────────────────►│
     │                           │                         │                     │
     │                           │  Decrypt via Lit +      │                     │
     │                           │  serve paper content    │                     │
     │◄── 200 OK + paper PDF ────│                         │                     │
```

### 5.3 Revenue Split Smart Contract

A Solidity smart contract deployed on Hedera EVM handles automatic revenue distribution.

```solidity
// Simplified — production version needs reentrancy guards, etc.
contract PaperRevenueSplitter {
    
    struct SplitConfig {
        address[] authors;
        uint256[] authorShares;      // Basis points per author (from authorship contract)
        address[] reviewers;
        address journal;
        address platform;
    }
    
    // paperHash => SplitConfig
    mapping(bytes32 => SplitConfig) public splits;
    
    // Revenue split percentages (basis points, 10000 = 100%)
    uint256 public constant AUTHOR_POOL = 7000;    // 70%
    uint256 public constant REVIEWER_POOL = 1500;  // 15%
    uint256 public constant JOURNAL_SHARE = 1000;   // 10%
    uint256 public constant PLATFORM_SHARE = 500;   // 5%
    
    function distributePaperRevenue(bytes32 paperHash) external payable {
        SplitConfig storage config = splits[paperHash];
        uint256 total = msg.value;
        
        // Split to authors per their contribution percentages
        uint256 authorPool = (total * AUTHOR_POOL) / 10000;
        for (uint i = 0; i < config.authors.length; i++) {
            uint256 authorAmount = (authorPool * config.authorShares[i]) / 10000;
            payable(config.authors[i]).transfer(authorAmount);
        }
        
        // Split equally to reviewers
        uint256 reviewerPool = (total * REVIEWER_POOL) / 10000;
        uint256 perReviewer = reviewerPool / config.reviewers.length;
        for (uint i = 0; i < config.reviewers.length; i++) {
            payable(config.reviewers[i]).transfer(perReviewer);
        }
        
        // Journal and platform
        payable(config.journal).transfer((total * JOURNAL_SHARE) / 10000);
        payable(config.platform).transfer((total * PLATFORM_SHARE) / 10000);
    }
    
    // Called when paper is published — locks the split configuration
    // Uses Hedera System Contracts to read HTS data if needed
    function registerPaperSplit(
        bytes32 paperHash,
        address[] calldata authors,
        uint256[] calldata authorShares,
        address[] calldata reviewers,
        address journal
    ) external {
        // Validation: authorShares must sum to 10000
        // Store immutable split config
        splits[paperHash] = SplitConfig(
            authors, authorShares, reviewers, journal, msg.sender
        );
    }
}
```

### 5.4 x402 Middleware

The API uses x402 middleware on paper content endpoints:

```typescript
// lib/x402/middleware.ts
import { verifyPayment } from './facilitator';

export function x402PaymentGate(getPaperConfig: (paperId: string) => Promise<PaymentConfig>) {
    return async (req: NextRequest, paperId: string) => {
        const config = await getPaperConfig(paperId);
        
        // Free access papers skip payment
        if (config.price === 0) return { paid: true, free: true };
        
        const paymentHeader = req.headers.get('X-PAYMENT');
        
        if (!paymentHeader) {
            // Return 402 with payment requirements
            return {
                paid: false,
                status: 402,
                headers: {
                    'PAYMENT-REQUIRED': JSON.stringify({
                        scheme: 'exact',
                        network: 'hedera',
                        amount: config.price.toString(),
                        currency: 'USDC',
                        receiver: config.splitContractAddress,
                        facilitator: process.env.X402_FACILITATOR_URL,
                        description: `Access: ${config.paperTitle}`,
                        metadata: {
                            paperHash: config.paperHash,
                            splitBreakdown: {
                                authors: '70%',
                                reviewers: '15%',
                                journal: '10%',
                                platform: '5%',
                            }
                        }
                    })
                }
            };
        }
        
        // Verify payment with facilitator
        const verification = await verifyPayment(paymentHeader, config);
        
        if (verification.verified) {
            // Log earnings event
            await recordEarningsEvent(config.paperHash, verification.txHash, config.price);
            return { paid: true, txHash: verification.txHash };
        }
        
        return { paid: false, status: 402, error: 'Payment verification failed' };
    };
}
```

### 5.5 x402 Facilitator

Using BlockyDevs' open-source Hedera x402 facilitator (supports Hedera testnet). The facilitator:

1. Receives payment payload from our API
2. Verifies the client's signed payment authorization
3. Submits the USDC transfer on Hedera
4. Returns verification to our API
5. Our API then calls the `PaperRevenueSplitter` contract to distribute funds

For MVP/hackathon: use the hosted Hedera testnet facilitator. For production: self-host or use multiple facilitators.

### 5.6 Payment Configuration Per Paper

Authors set access pricing at registration/publication time:

```typescript
interface PaperPaymentConfig {
    paperHash: string;
    price: number;              // In USD, 0 = free
    currency: 'USDC';
    splitContractAddress: string;  // Deployed PaperRevenueSplitter
    authorWallets: string[];       // From authorship contract
    authorShares: number[];        // From contribution percentages
    reviewerWallets: string[];     // Assigned after review
    journalWallet: string;
    isOpenAccess: boolean;         // If true, funder escrow covers cost
    funderEscrowAddress?: string;  // v2: escrow contract for open access
}
```

---

## 6. HTS Soulbound Reputation Tokens

### 6.1 Overview

Reviewer reputation is represented as non-transferable (soulbound) HTS tokens. Each reputation event mints a token to the reviewer's account. The token's metadata encodes the event details. This makes reputation:

- **Portable:** Any platform can read a reviewer's HTS token balance and metadata
- **Non-transferable:** Reputation can't be bought, sold, or given away
- **Journal-independent:** No journal owns or controls the reputation (FR-5.4)
- **Verifiable:** Anyone can audit the full reputation history on-chain

### 6.2 Token Design

```
HTS Token: RESEARCH_CHAIN_REPUTATION (RCR)
Type: Non-Fungible Token (NFT) — each event is a unique token
Supply: Unlimited (minted per event)
Transferable: No (custom fee schedule with max 0 transfer or admin-only transfer)
Decimals: N/A (NFT)

Each NFT metadata encodes:
{
    "type": "review_completed" | "review_late" | "review_quality" | 
            "editor_rating" | "author_rating" | "paper_published" | 
            "paper_retracted",
    "paperId": "hash",
    "journalId": "string",
    "timestamp": "ISO8601",
    "score": number,          // Positive or negative
    "details": {
        "timeliness_days": number,      // For review_completed
        "rating": number,               // For editor/author ratings
        "criteria_met_ratio": number    // For review_quality
    }
}
```

### 6.3 HTS Integration via Hedera System Contracts

We use the hybrid approach: interact with HTS through Hedera's EVM System Contracts. This lets our Solidity smart contracts mint reputation tokens alongside revenue distribution.

```solidity
// Interacting with HTS via Hedera System Contracts
import "./hedera/HederaTokenService.sol";

contract ReputationManager is HederaTokenService {
    
    address public reputationTokenId;
    
    // Mint reputation token to reviewer after review completion
    function mintReputationToken(
        address reviewer,
        bytes memory metadata  // Encoded reputation event
    ) external onlyPlatform {
        // Uses Hedera System Contract to mint HTS NFT
        (int response, , int64[] memory serialNumbers) = 
            HederaTokenService.mintToken(reputationTokenId, 0, new bytes[](1));
        
        require(response == HederaResponseCodes.SUCCESS, "Mint failed");
        
        // Transfer to reviewer (soulbound — no further transfers allowed)
        HederaTokenService.transferNFT(
            reputationTokenId, 
            address(this), 
            reviewer, 
            serialNumbers[0]
        );
    }
    
    // Compute aggregate reputation score from mirror node data
    // (Called off-chain, reads on-chain token history)
    // Score = weighted sum of all reputation token scores
}
```

### 6.4 Reputation Score Computation

Reputation is computed off-chain from on-chain data (hourly cron job):

```
Overall Score = (
    0.30 × Timeliness Score +
    0.25 × Editor Rating Average +
    0.25 × Author Feedback Average +
    0.20 × Publication Outcome Score
)

Where:
- Timeliness = f(days to complete vs deadline across all reviews)
- Editor Rating = average of editor-assigned ratings (1-5)
- Author Feedback = average of anonymous author ratings (1-5) (FR-6.2)
- Publication Outcome = f(retractions, corrections on reviewed papers)
```

The off-chain computation reads HTS token metadata from the mirror node, aggregates scores, and stores the result in the `reputation_scores` table. The raw data (individual tokens) is always on-chain and independently verifiable.

### 6.5 Reputation → Revenue Flywheel

```
Better reviews ──► Higher reputation (more HTS tokens with high scores)
       │                          │
       │                          ▼
       │              More review assignments from journals
       │              (editors search by reputation score)
       │                          │
       │                          ▼
       │              More papers reviewed that earn x402 revenue
       │                          │
       │                          ▼
       │              More income from reviewer revenue share (15%)
       │                          │
       └──────────── Incentive to review well ◄──┘
```

---

## 7. Lit Protocol — Decentralized Access Control

### 7.1 Overview

Instead of relying on our server to gate access to private content, Lit Protocol provides cryptographically enforced access control. Paper content is encrypted before upload. Only users who meet on-chain conditions can decrypt.

This means even if someone compromises our database or R2 storage, they get encrypted blobs that are useless without Lit Network cooperation.

### 7.2 Access Control Model

| Paper State | Who Can Decrypt | Lit Access Condition |
|---|---|---|
| **Private Draft** | Only the author(s) on the authorship contract | `walletAddress IN authorWallets` (from contract) |
| **Under Review** | Authors + assigned reviewers + editor | `walletAddress IN (authorWallets ∪ reviewerWallets ∪ editorWallet)` |
| **Published (paid)** | Anyone who has paid via x402 | `hasValidPaymentReceipt(paperHash, walletAddress)` |
| **Published (free)** | Anyone | No encryption (stored in plaintext on R2) |
| **Retracted** | No one (content sealed) | `false` (no one can decrypt) |

### 7.3 Encryption Flow

```
Author (Browser)                  Lit Network                    R2 Storage
    │                                 │                              │
    │  1. Author uploads PDF          │                              │
    │  2. hashFile(pdf) → paperHash   │                              │
    │                                 │                              │
    │  3. Define access condition:    │                              │
    │     { contractAddress: "0x..",  │                              │
    │       chain: "hedera",         │                              │
    │       method: "isAuthor",      │                              │
    │       params: [walletAddr],    │                              │
    │       returnValueTest: true }  │                              │
    │                                 │                              │
    │  4. Request encryption key ────►│                              │
    │                                 │  Verify conditions           │
    │  ◄── Encryption key shares ─────│  (threshold MPC)             │
    │                                 │                              │
    │  5. Encrypt PDF client-side     │                              │
    │     encryptedPdf = encrypt(     │                              │
    │       pdf, litEncryptionKey)    │                              │
    │                                 │                              │
    │  6. Upload encrypted blob ──────┼──────────────────────────────►│
    │                                 │                              │
    │  7. Store accessConditionId     │                              │
    │     + encryptedSymmetricKey     │                              │
    │     in database                 │                              │
```

### 7.4 Decryption Flow (with x402 Payment)

```
Reader (Browser)                 API              Lit Network        R2
    │                             │                    │              │
    │  GET /papers/{id}/content   │                    │              │
    │────────────────────────────►│                    │              │
    │                             │                    │              │
    │  ◄── 402 Payment Required ──│                    │              │
    │                             │                    │              │
    │  [Pay via x402]             │                    │              │
    │  GET + X-PAYMENT header ───►│                    │              │
    │                             │                    │              │
    │                             │ Verify payment     │              │
    │                             │ Record receipt     │              │
    │                             │                    │              │
    │                             │ Return encrypted   │              │
    │                             │ blob + condition ──┼──── fetch ──►│
    │  ◄── { encryptedPdf,        │                    │              │
    │       accessCondition,      │                    │              │
    │       encSymmetricKey } ────│                    │              │
    │                             │                    │              │
    │  Request decryption ───────────────────────────►│              │
    │  (prove wallet + payment    │                    │              │
    │   receipt on-chain)         │                    │              │
    │                             │                    │              │
    │  ◄── Decryption key shares ─────────────────────│              │
    │                             │                    │              │
    │  Decrypt PDF in browser     │                    │              │
    │  Display to reader          │                    │              │
```

### 7.5 Lit Access Condition: Payment Verification

The critical access condition for published papers checks whether the reader has a valid x402 payment receipt on-chain:

```typescript
// Lit Access Condition for paid paper access
const accessCondition = {
    conditionType: 'evmContract',
    contractAddress: PAYMENT_RECEIPT_CONTRACT,
    chain: 'hedera',
    functionName: 'hasValidReceipt',
    functionParams: [':userAddress', paperHash],
    functionAbi: [{
        name: 'hasValidReceipt',
        inputs: [
            { name: 'reader', type: 'address' },
            { name: 'paperHash', type: 'bytes32' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    }],
    returnValueTest: {
        comparator: '=',
        value: 'true'
    }
};
```

This means even the platform cannot bypass payment — the Lit Network independently verifies on-chain that the reader has paid.

### 7.6 Updating Access Conditions (State Transitions)

When a paper's state changes, we update the Lit access condition:

```typescript
// lib/lit/access-control.ts
export async function updatePaperAccess(
    paperId: string,
    newState: PaperState,
    config: PaperAccessConfig
) {
    switch (newState) {
        case 'registered':
            // Private draft — only authors
            return createCondition({
                type: 'walletInList',
                wallets: config.authorWallets
            });
            
        case 'under_review':
            // Authors + reviewers + editor
            return createCondition({
                type: 'walletInList',
                wallets: [
                    ...config.authorWallets,
                    ...config.reviewerWallets,
                    config.editorWallet
                ]
            });
            
        case 'published':
            if (config.price === 0) {
                // Open access — no encryption needed
                return decryptAndReuploadAsPlaintext(paperId);
            }
            // Paid access — check payment receipt on-chain
            return createCondition({
                type: 'evmContract',
                contract: PAYMENT_RECEIPT_CONTRACT,
                method: 'hasValidReceipt',
                params: [':userAddress', config.paperHash]
            });
            
        case 'retracted':
            // No one can access
            return createCondition({ type: 'never' });
    }
}
```

### 7.7 Re-encryption Consideration

When access conditions change (e.g., paper goes from "under review" to "published"), we don't re-encrypt the content. Instead, we update the Lit access condition. Lit's architecture supports condition updates because the decryption key shares are released based on *current* condition evaluation, not the condition at encryption time.

However, if a paper transitions to a *more restrictive* state (e.g., retraction), we should re-encrypt with new conditions to ensure previously cached keys cannot be reused.

---

## 8. Off-Chain Storage Architecture

### 8.1 Storage Strategy

**Cloudflare R2** (S3-compatible, zero egress fees) with content-addressed naming. Objects are keyed by their SHA-256 hash.

**Key difference from v1:** All non-public files are stored **Lit-encrypted**. The R2 bucket holds encrypted blobs. Even a full R2 breach exposes nothing.

```
Bucket structure:
papers/{sha256hash}.enc           # Lit-encrypted paper PDFs
papers/{sha256hash}               # Plaintext (only for free/open access published papers)
datasets/{sha256hash}.enc         # Lit-encrypted datasets
environments/{sha256hash}         # Environment specs (typically unencrypted)
reviews/{sha256hash}              # Review content (encrypted for pre-decision, plaintext post)
```

### 8.2 Upload Flow (with Lit Encryption)

1. Client computes SHA-256 of the original (unencrypted) file
2. Client encrypts file via Lit SDK with appropriate access conditions
3. Client requests presigned upload URL from API, passing the original hash
4. Client uploads the *encrypted* blob directly to R2
5. API stores: original hash (for on-chain anchoring), Lit encryption metadata (condition ID, encrypted symmetric key), R2 object key
6. On-chain: only the original (pre-encryption) hash is recorded — this is what's verifiable

### 8.3 Verification

To verify a paper's authenticity:
1. Obtain the decrypted file (via payment + Lit decryption)
2. Compute SHA-256 of the decrypted content
3. Compare against the on-chain hash from the HCS paper topic
4. Match confirms the content is unaltered

---

## 9. Database Schema Design

PostgreSQL via Neon. Core schema with additions for x402 earnings, HTS reputation, and Lit encryption metadata.

### 9.1 Core Tables

```sql
-- ============================================================
-- IDENTITY
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    did             TEXT UNIQUE NOT NULL,
    wallet_address  TEXT UNIQUE NOT NULL,
    wallet_type     TEXT NOT NULL,                   -- 'hashpack' | 'metamask'
    display_name    TEXT,
    institution     TEXT,
    bio             TEXT,
    orcid_id        TEXT UNIQUE,
    orcid_token_enc TEXT,                            -- Encrypted OAuth token
    roles           TEXT[] NOT NULL DEFAULT '{}',
    research_fields TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PAPERS
-- ============================================================

CREATE TABLE papers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    abstract        TEXT,
    status          TEXT NOT NULL DEFAULT 'draft',
    visibility      TEXT NOT NULL DEFAULT 'private',
    current_version INT NOT NULL DEFAULT 1,
    owner_did       TEXT NOT NULL REFERENCES users(did),
    journal_id      UUID REFERENCES journals(id),
    contract_id     UUID REFERENCES authorship_contracts(id),
    research_fields TEXT[] DEFAULT '{}',
    -- x402 payment configuration
    access_price    DECIMAL(10,4) DEFAULT 1.00,      -- USD, 0 = free
    access_currency TEXT DEFAULT 'USDC',
    split_contract  TEXT,                             -- Deployed splitter contract address
    is_open_access  BOOLEAN DEFAULT false,
    -- Lit Protocol encryption
    lit_condition_id TEXT,                            -- Current Lit access condition
    lit_encrypted_key TEXT,                           -- Encrypted symmetric key (from Lit)
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE paper_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id            UUID NOT NULL REFERENCES papers(id),
    version_number      INT NOT NULL,
    paper_hash          TEXT NOT NULL,               -- SHA-256 of ORIGINAL file
    dataset_hash        TEXT,
    dataset_url         TEXT,
    code_commit_hash    TEXT,
    code_repo_url       TEXT,
    environment_hash    TEXT,
    file_storage_key    TEXT,                         -- R2 key (encrypted blob)
    hedera_topic_id     TEXT,
    hedera_tx_id        TEXT,
    hedera_timestamp    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(paper_id, version_number)
);

-- ============================================================
-- AUTHORSHIP CONTRACTS
-- ============================================================

CREATE TABLE authorship_contracts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id        UUID REFERENCES papers(id),
    paper_title     TEXT,
    contract_hash   TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    version         INT NOT NULL DEFAULT 1,
    creator_did     TEXT NOT NULL REFERENCES users(did),
    hedera_tx_id    TEXT,
    hedera_timestamp TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contract_contributors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id         UUID NOT NULL REFERENCES authorship_contracts(id),
    contributor_did     TEXT,
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
    display_order       INT NOT NULL
);

-- ============================================================
-- JOURNALS & SUBMISSIONS
-- ============================================================

CREATE TABLE journals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    issn            TEXT,
    editor_did      TEXT NOT NULL REFERENCES users(did),
    wallet_address  TEXT NOT NULL,                    -- For receiving x402 revenue share
    reputation_score DECIMAL(3,2) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id        UUID NOT NULL REFERENCES papers(id),
    journal_id      UUID NOT NULL REFERENCES journals(id),
    version_id      UUID NOT NULL REFERENCES paper_versions(id),
    contract_id     UUID NOT NULL REFERENCES authorship_contracts(id),
    status          TEXT NOT NULL DEFAULT 'submitted',
    criteria_hash   TEXT,
    criteria_tx_id  TEXT,
    decision        TEXT,
    decision_justification TEXT,
    decision_tx_id  TEXT,
    review_deadline TIMESTAMPTZ,
    submitted_at    TIMESTAMPTZ DEFAULT now(),
    decided_at      TIMESTAMPTZ
);

CREATE TABLE review_criteria (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id   UUID NOT NULL REFERENCES submissions(id),
    criteria_json   JSONB NOT NULL,
    criteria_hash   TEXT NOT NULL,
    hedera_tx_id    TEXT,
    published_at    TIMESTAMPTZ
);

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id       UUID NOT NULL REFERENCES submissions(id),
    reviewer_did        TEXT NOT NULL REFERENCES users(did),
    review_hash         TEXT,
    criteria_evaluations JSONB,
    strengths           TEXT,
    weaknesses          TEXT,
    questions           TEXT,
    confidential_comments TEXT,                 -- NEVER on-chain
    recommendation      TEXT,
    status              TEXT DEFAULT 'assigned',
    deadline            TIMESTAMPTZ,
    hedera_tx_id        TEXT,
    -- HTS reputation token minted on submission
    reputation_token_serial INT,               -- HTS NFT serial number
    submitted_at        TIMESTAMPTZ,
    assigned_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reviewer_ratings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id       UUID NOT NULL REFERENCES reviews(id) UNIQUE,
    rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    -- NO author reference — anonymity by design (FR-6.3)
    rating_hash     TEXT NOT NULL,
    -- HTS token minted for this rating event
    reputation_token_serial INT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- REPUTATION (append-only + materialized)
-- ============================================================

CREATE TABLE reputation_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_did        TEXT NOT NULL REFERENCES users(did),
    event_type      TEXT NOT NULL,
    score_delta     DECIMAL(5,2),
    details         JSONB,
    hts_token_serial INT,                      -- Corresponding HTS NFT serial
    hedera_tx_id    TEXT,                       -- HTS mint transaction
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reputation_scores (
    user_did            TEXT PRIMARY KEY REFERENCES users(did),
    overall_score       DECIMAL(5,2) DEFAULT 0,
    timeliness_score    DECIMAL(5,2) DEFAULT 0,
    editor_rating_avg   DECIMAL(5,2) DEFAULT 0,
    author_rating_avg   DECIMAL(5,2) DEFAULT 0,
    publication_score   DECIMAL(5,2) DEFAULT 0,
    review_count        INT DEFAULT 0,
    total_earnings      DECIMAL(12,4) DEFAULT 0,  -- Lifetime x402 earnings
    last_computed_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- EARNINGS (x402 revenue tracking)
-- ============================================================

CREATE TABLE earnings_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id        UUID NOT NULL REFERENCES papers(id),
    payer_address   TEXT,                           -- Reader who paid (optional, privacy)
    total_amount    DECIMAL(10,4) NOT NULL,         -- Total payment in USD
    currency        TEXT NOT NULL DEFAULT 'USDC',
    -- Individual splits
    author_pool     DECIMAL(10,4) NOT NULL,
    reviewer_pool   DECIMAL(10,4) NOT NULL,
    journal_share   DECIMAL(10,4) NOT NULL,
    platform_share  DECIMAL(10,4) NOT NULL,
    -- On-chain references
    x402_tx_hash    TEXT,                           -- x402 payment settlement tx
    split_tx_hash   TEXT,                           -- Revenue splitter contract tx
    hedera_tx_id    TEXT,                           -- HCS earnings topic entry
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Per-recipient earnings breakdown
CREATE TABLE earnings_recipients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    earnings_event_id UUID NOT NULL REFERENCES earnings_events(id),
    recipient_did   TEXT NOT NULL,
    recipient_wallet TEXT NOT NULL,
    role            TEXT NOT NULL,                   -- 'author' | 'reviewer' | 'journal' | 'platform'
    amount          DECIMAL(10,4) NOT NULL,
    paper_id        UUID NOT NULL REFERENCES papers(id)
);

-- ============================================================
-- PAYMENT RECEIPTS (for Lit access control verification)
-- ============================================================

CREATE TABLE payment_receipts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id        UUID NOT NULL REFERENCES papers(id),
    payer_wallet    TEXT NOT NULL,
    paper_hash      TEXT NOT NULL,
    x402_tx_hash    TEXT NOT NULL,
    amount          DECIMAL(10,4) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(paper_id, payer_wallet)                  -- One receipt per reader per paper
);

-- ============================================================
-- NOTIFICATIONS & ACTIVITY
-- ============================================================

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_did        TEXT NOT NULL REFERENCES users(did),
    type            TEXT NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT,
    link            TEXT,
    is_read         BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE activity_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_did        TEXT NOT NULL,
    paper_id        UUID REFERENCES papers(id),
    action          TEXT NOT NULL,
    details         JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE retractions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id            UUID NOT NULL REFERENCES papers(id),
    requesting_party    TEXT NOT NULL,
    reason              TEXT NOT NULL,
    failed_component    TEXT NOT NULL,
    hedera_tx_id        TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);
```

### 9.2 Key Indexes

```sql
-- Papers
CREATE INDEX idx_papers_owner ON papers(owner_did);
CREATE INDEX idx_papers_status ON papers(status);
CREATE INDEX idx_paper_versions_paper ON paper_versions(paper_id);
CREATE INDEX idx_paper_versions_hash ON paper_versions(paper_hash);

-- Contracts
CREATE INDEX idx_contracts_creator ON authorship_contracts(creator_did);
CREATE INDEX idx_contributors_contract ON contract_contributors(contract_id);
CREATE INDEX idx_contributors_did ON contract_contributors(contributor_did);

-- Reviews
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_did);
CREATE INDEX idx_reviews_submission ON reviews(submission_id);

-- Submissions
CREATE INDEX idx_submissions_journal ON submissions(journal_id, status);

-- Reputation
CREATE INDEX idx_reputation_events_did ON reputation_events(user_did, created_at);

-- Earnings
CREATE INDEX idx_earnings_paper ON earnings_events(paper_id, created_at);
CREATE INDEX idx_earnings_recipients_did ON earnings_recipients(recipient_did);
CREATE INDEX idx_earnings_recipients_paper ON earnings_recipients(paper_id);

-- Payment receipts (critical for Lit access condition verification)
CREATE INDEX idx_receipts_payer_paper ON payment_receipts(payer_wallet, paper_hash);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_did, is_read, created_at);

-- Full-text search
CREATE INDEX idx_papers_search ON papers USING gin(
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(abstract,''))
);
```

---

## 10. API Design

### 10.1 Authentication Flow

Every authenticated request carries a JWT obtained through wallet signature:

1. Client constructs sign-in message: `"Sign in to Research Chain at [timestamp]"`
2. Wallet signs the message
3. Client → `POST /api/auth/verify-wallet { walletAddress, signature, message }`
4. Server verifies signature, looks up/creates user, returns JWT in httpOnly cookie
5. All subsequent API calls include the JWT cookie

### 10.2 API Route Structure

```
app/api/
├── auth/
│   ├── verify-wallet/route.ts
│   ├── orcid/callback/route.ts
│   └── session/route.ts
├── users/
│   ├── route.ts
│   └── [did]/
│       ├── reputation/route.ts        # Public reputation query
│       └── earnings/route.ts          # Earnings dashboard data
├── papers/
│   ├── route.ts                       # List/create
│   ├── [paperId]/route.ts             # Detail
│   ├── [paperId]/versions/route.ts
│   ├── [paperId]/content/route.ts     # x402-GATED: paper PDF access
│   ├── [paperId]/submit/route.ts
│   └── [paperId]/pricing/route.ts     # Set access price
├── contracts/
│   ├── route.ts
│   ├── [contractId]/route.ts
│   └── [contractId]/sign/route.ts
├── reviews/
│   ├── route.ts
│   ├── [reviewId]/route.ts
│   └── [reviewId]/rate/route.ts
├── journals/
│   ├── route.ts
│   ├── [journalId]/submissions/route.ts
│   ├── [journalId]/criteria/route.ts
│   └── [journalId]/decisions/route.ts
├── hedera/
│   └── verify/route.ts
├── earnings/
│   ├── route.ts                       # User's earnings summary
│   └── [paperId]/route.ts             # Per-paper earnings breakdown
├── upload/
│   └── presigned/route.ts             # Generate R2 presigned URLs
└── cron/
    ├── reputation/route.ts            # Recompute scores + mint HTS tokens
    ├── deadlines/route.ts             # Review deadline monitoring
    └── earnings-aggregate/route.ts    # Aggregate earnings stats
```

### 10.3 Key API Contracts

**Access Paper Content — x402 Gated (GET /api/papers/:id/content)**

```typescript
// If no payment header → 402 with payment requirements
// If valid payment → decrypt via Lit → return PDF

export async function GET(req: NextRequest, { params }) {
    const paper = await getPaper(params.id);
    
    // Free papers: return directly
    if (paper.access_price === 0 || paper.is_open_access) {
        const content = await fetchFromR2(paper.file_storage_key);
        return new Response(content, { headers: { 'Content-Type': 'application/pdf' } });
    }
    
    // x402 payment gate
    const paymentResult = await x402PaymentGate(paper)(req);
    
    if (!paymentResult.paid) {
        return new Response(null, {
            status: 402,
            headers: paymentResult.headers
        });
    }
    
    // Payment verified — record receipt for Lit access
    await recordPaymentReceipt(paper.id, paymentResult);
    
    // Return encrypted blob + Lit metadata for client-side decryption
    const encryptedContent = await fetchFromR2(paper.file_storage_key);
    return Response.json({
        encryptedContent: encryptedContent,       // Base64 encrypted blob
        litConditionId: paper.lit_condition_id,
        litEncryptedKey: paper.lit_encrypted_key,
        paperHash: paper.current_version_hash     // For post-decryption verification
    });
}
```

**Register Paper with Pricing (POST /api/papers)**

```typescript
// Request
{
    title: string;
    abstract: string;
    visibility: 'private' | 'public';
    paperHash: string;
    datasetHash?: string;
    codeCommitHash?: string;
    codeRepoUrl?: string;
    environmentHash?: string;
    researchFields: string[];
    // NEW: pricing
    accessPrice: number;           // USD, 0 = free
    isOpenAccess: boolean;
    // NEW: Lit encryption metadata
    litConditionId: string;        // Access condition created client-side
    litEncryptedKey: string;       // Encrypted symmetric key from Lit
}

// Response
{
    paperId: string;
    versionId: string;
    hederaTxId: string;
    hederaTimestamp: string;
    splitContractAddress: string;  // Deployed revenue splitter (after publication)
    status: 'registered';
}
```

**Get Earnings Dashboard (GET /api/earnings)**

```typescript
// Response
{
    totalEarnings: number;              // Lifetime USD
    periodEarnings: {
        last7Days: number;
        last30Days: number;
        last90Days: number;
    };
    byRole: {
        asAuthor: number;
        asReviewer: number;
        asEditor: number;
    };
    topPapers: Array<{
        paperId: string;
        title: string;
        totalEarnings: number;
        accessCount: number;
        role: 'author' | 'reviewer' | 'editor';
    }>;
    recentTransactions: Array<{
        paperId: string;
        amount: number;
        role: string;
        txHash: string;
        timestamp: string;
    }>;
}
```

---

## 11. Authentication & Identity Architecture

### 11.1 Identity Stack

```
┌─────────────────────────────────┐
│         ORCID (Academic)        │  ← OAuth 2.0 link
├─────────────────────────────────┤
│    HTS Tokens (Reputation)      │  ← Soulbound NFTs on Hedera
├─────────────────────────────────┤
│      DID:Hedera (Decentralized) │  ← On-chain identity document
├─────────────────────────────────┤
│  Wallet (HashPack / MetaMask)   │  ← Authentication primitive
└─────────────────────────────────┘
```

### 11.2 Wallet Adapter

```typescript
// lib/wallet/adapter.ts
interface WalletAdapter {
    connect(): Promise<{ address: string; publicKey: string }>;
    disconnect(): Promise<void>;
    signMessage(message: string): Promise<string>;
    signTransaction(tx: Transaction): Promise<Transaction>;
    signX402Payment(payload: X402PaymentPayload): Promise<string>;
    getNetwork(): Promise<'mainnet' | 'testnet'>;
    onAccountChange(callback: (address: string) => void): void;
}

class HashPackAdapter implements WalletAdapter { ... }
class MetaMaskAdapter implements WalletAdapter { ... }
```

### 11.3 Session Management

No localStorage. JWT in httpOnly cookie. On page refresh: cookie persists, frontend silently reconnects wallet, validates address matches JWT claim.

---

## 12. Frontend Architecture

### 12.1 Page Structure

```
app/
├── (public)/
│   ├── page.tsx                    # Page 1: Landing Page
│   └── explore/
│       ├── page.tsx                # Page 6: Public Explorer
│       └── [paperId]/page.tsx      # Page 6: Paper Detail View
├── (auth)/
│   └── connect/page.tsx            # Page 2: Wallet Connect / Login
├── (dashboard)/
│   ├── layout.tsx                  # Shared shell (top bar, role switcher, notifications)
│   ├── author/
│   │   ├── page.tsx                # Page 3: Author Dashboard (+ earnings widget)
│   │   ├── contracts/
│   │   │   ├── new/page.tsx        # Page 4: Authorship Contract Builder
│   │   │   └── [contractId]/page.tsx
│   │   └── papers/
│   │       ├── new/page.tsx        # Page 5: Paper Registration (+ pricing config)
│   │       └── [paperId]/page.tsx
│   ├── reviewer/
│   │   ├── page.tsx                # Page 7: Reviewer Dashboard (+ earnings + reputation tokens)
│   │   └── reviews/
│   │       └── [reviewId]/page.tsx # Page 8: Review Workspace
│   ├── editor/
│   │   └── page.tsx                # Page 9: Journal Dashboard
│   ├── earnings/
│   │   └── page.tsx                # NEW: Earnings Dashboard (all roles)
│   └── settings/page.tsx           # Page 10: Profile / Settings
```

### 12.2 State Management

```
React Context Providers (root layout):
├── WalletProvider         — Connection state, adapter instance, x402 signing
├── AuthProvider           — User profile, DID, roles, JWT session
├── RoleProvider           — Active role, role switching
├── LitProvider            — Lit SDK client, encryption/decryption helpers
└── NotificationProvider   — Real-time notification count
```

### 12.3 Key Shared Components

```
components/
├── wallet/
│   ├── WalletConnectButton.tsx
│   ├── WalletSelector.tsx
│   └── WalletStatus.tsx
├── identity/
│   ├── OrcidLinkButton.tsx
│   └── DidDisplay.tsx
├── hedera/
│   ├── TransactionLink.tsx
│   ├── HashDisplay.tsx
│   └── OnChainBadge.tsx
├── paper/
│   ├── PaperCard.tsx
│   ├── PaperStatusBadge.tsx
│   ├── ProvenancePanel.tsx
│   ├── VersionGraph.tsx
│   ├── AccessPriceConfig.tsx        # NEW: Author sets paper price
│   └── PayToRead.tsx                # NEW: x402 payment + Lit decrypt flow
├── contract/
│   ├── ContributorTable.tsx
│   ├── SignatureStatus.tsx
│   └── ContractPreview.tsx
├── review/
│   ├── CriteriaChecklist.tsx
│   ├── ReviewForm.tsx
│   └── MethodologyReminder.tsx
├── reputation/
│   ├── ReputationScoreCard.tsx
│   ├── ReputationTokenList.tsx      # NEW: Display HTS soulbound tokens
│   └── ReputationHistory.tsx
├── earnings/
│   ├── EarningsSummary.tsx          # NEW: Total earnings by role
│   ├── EarningsChart.tsx            # NEW: Revenue over time
│   ├── PaperEarningsTable.tsx       # NEW: Per-paper breakdown
│   └── RevenueSplitVisual.tsx       # NEW: Shows 70/15/10/5 split
├── dashboard/
│   ├── DashboardShell.tsx
│   ├── SummaryCard.tsx
│   ├── ActivityFeed.tsx
│   └── PendingActions.tsx
└── ui/
    ├── DataTable.tsx
    ├── SearchBar.tsx
    └── FileUploadWithHash.tsx
```

### 12.4 Client-Side Hashing

```typescript
// lib/hashing.ts — unchanged from v1
export async function hashFile(file: File): Promise<string> { ... }
export async function hashString(content: string): Promise<string> { ... }
export function canonicalJson(obj: object): string { ... }
```

### 12.5 Lit SDK Integration

```typescript
// lib/lit/client.ts
import * as LitJsSdk from '@lit-protocol/lit-node-client';

let litClient: LitJsSdk.LitNodeClient | null = null;

export async function getLitClient() {
    if (!litClient) {
        litClient = new LitJsSdk.LitNodeClient({ litNetwork: 'cayenne' });
        await litClient.connect();
    }
    return litClient;
}

// lib/lit/encrypt.ts
export async function encryptPaper(
    file: File,
    accessConditions: any[],
    walletSig: any
): Promise<{ encryptedBlob: Blob; encryptedSymmetricKey: string }> {
    const client = await getLitClient();
    const { encryptedFile, symmetricKey } = await LitJsSdk.encryptFile({ file });
    
    const encryptedSymmetricKey = await client.saveEncryptionKey({
        accessControlConditions: accessConditions,
        symmetricKey,
        authSig: walletSig,
        chain: 'hedera'
    });
    
    return {
        encryptedBlob: encryptedFile,
        encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16')
    };
}

// lib/lit/decrypt.ts
export async function decryptPaper(
    encryptedBlob: Blob,
    encryptedSymmetricKey: string,
    accessConditions: any[],
    walletSig: any
): Promise<File> {
    const client = await getLitClient();
    
    const symmetricKey = await client.getEncryptionKey({
        accessControlConditions: accessConditions,
        toDecrypt: encryptedSymmetricKey,
        authSig: walletSig,
        chain: 'hedera'
    });
    
    const decryptedFile = await LitJsSdk.decryptFile({
        file: encryptedBlob,
        symmetricKey
    });
    
    return new File([decryptedFile], 'paper.pdf', { type: 'application/pdf' });
}
```

---

## 13. Data Flow Diagrams

### 13.1 Paper Registration (with Lit Encryption)

```
Author                          Lit Network      API           Hedera      R2
  │                                 │              │              │          │
  │ 1. Fill details, upload PDF     │              │              │          │
  │ 2. hashFile(pdf) → paperHash   │              │              │          │
  │ 3. Set price ($1.00)           │              │              │          │
  │                                 │              │              │          │
  │ 4. Create access conditions ───►│              │              │          │
  │    (authors-only for draft)     │              │              │          │
  │ ◄── encryptionKey ──────────────│              │              │          │
  │                                 │              │              │          │
  │ 5. Encrypt PDF client-side      │              │              │          │
  │                                 │              │              │          │
  │ 6. GET presigned URL ──────────────────────────►│              │          │
  │ ◄── presigned PUT URL ─────────────────────────│              │          │
  │ 7. Upload encrypted PDF ───────────────────────┼──────────────┼─────────►│
  │                                 │              │              │          │
  │ 8. POST /api/papers ──────────────────────────►│              │          │
  │    { paperHash, litCondition,   │              │              │          │
  │      litEncKey, price, ... }    │              │              │          │
  │                                 │              │── HCS msg ──►│          │
  │                                 │              │◄── receipt ──│          │
  │ ◄── { paperId, txId, ts } ────────────────────│              │          │
```

### 13.2 Paper Access (x402 + Lit Decrypt)

```
Reader                      API              Facilitator    Hedera    Lit     R2
  │                          │                    │           │        │      │
  │ GET /papers/{id}/content │                    │           │        │      │
  │─────────────────────────►│                    │           │        │      │
  │                          │                    │           │        │      │
  │ ◄── 402 Payment Required │                    │           │        │      │
  │   { $1.00, USDC, hedera, │                    │           │        │      │
  │     split: 70/15/10/5 }  │                    │           │        │      │
  │                          │                    │           │        │      │
  │ Wallet signs payment     │                    │           │        │      │
  │ GET + X-PAYMENT ────────►│                    │           │        │      │
  │                          │── verify ─────────►│           │        │      │
  │                          │                    │── settle ─►│        │      │
  │                          │◄── verified ───────│           │        │      │
  │                          │                    │           │        │      │
  │                          │── split revenue ───────────────►│        │      │
  │                          │   (smart contract)  │          │        │      │
  │                          │── record receipt ──►│          │        │      │
  │                          │                    │           │        │      │
  │                          │── fetch encrypted ──┼───────────┼────────┼─────►│
  │ ◄── { encryptedPdf,      │                    │           │        │      │
  │       litCondition,       │                    │           │        │      │
  │       litEncKey } ────────│                    │           │        │      │
  │                          │                    │           │        │      │
  │ Request decrypt key ─────────────────────────────────────────────►│      │
  │ (prove payment receipt   │                    │           │        │      │
  │  exists on-chain)        │                    │           │        │      │
  │ ◄── decryption key ─────────────────────────────────────────────│      │
  │                          │                    │           │        │      │
  │ Decrypt PDF in browser   │                    │           │        │      │
  │ Verify hash matches      │                    │           │        │      │
  │ on-chain record          │                    │           │        │      │
  │ Display paper ✓          │                    │           │        │      │
```

### 13.3 Review Completion (with HTS Token Mint)

```
Reviewer                     API                  Hedera (HCS)    Hedera (HTS)
  │                           │                       │                │
  │ Submit review             │                       │                │
  │ hash(review) → reviewHash │                       │                │
  │── POST /api/reviews/{id} ►│                       │                │
  │                           │── HCS review msg ────►│                │
  │                           │◄── receipt ────────────│                │
  │                           │                       │                │
  │                           │── Mint soulbound ─────┼───────────────►│
  │                           │   reputation NFT      │                │
  │                           │   (review_completed,  │                │
  │                           │    timeliness, etc)   │                │
  │                           │◄── mint receipt ──────┼────────────────│
  │                           │                       │                │
  │ ◄── { txId, tokenSerial,  │                       │                │
  │       reputationUpdate } ─│                       │                │
```

---

## 14. Deployment Architecture

### 14.1 Vercel Configuration

```
Vercel Project
├── Framework: Next.js (App Router)
├── Runtime: Node.js (NOT Edge — Hedera SDK requires it)
├── Environment Variables:
│   ├── HEDERA_NETWORK, HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY
│   ├── HCS_TOPIC_* (7 topic IDs)
│   ├── HTS_REPUTATION_TOKEN_ID
│   ├── REVENUE_SPLITTER_CONTRACT_ADDRESS
│   ├── PAYMENT_RECEIPT_CONTRACT_ADDRESS
│   ├── X402_FACILITATOR_URL
│   ├── DATABASE_URL
│   ├── S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT
│   ├── LIT_NETWORK (cayenne | habanero | manzano)
│   ├── ORCID_CLIENT_ID, ORCID_CLIENT_SECRET, ORCID_REDIRECT_URI
│   ├── GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
│   ├── JWT_SECRET
│   └── UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
├── Cron Jobs:
│   ├── /api/cron/reputation          # Recompute + mint HTS tokens (hourly)
│   ├── /api/cron/deadlines           # Review deadline checks (hourly)
│   ├── /api/cron/earnings-aggregate  # Aggregate earning stats (daily)
│   └── /api/cron/cleanup             # Expire stale invites (daily)
```

### 14.2 Infrastructure Diagram

```
                    ┌──────────────┐
                    │   Cloudflare  │
                    │   (CDN/DNS)   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │    Vercel     │
                    │  ┌─────────┐ │
                    │  │ Next.js │ │
                    │  │  + x402 │ │
                    │  │ midware │ │
                    │  └────┬────┘ │     ┌────────────────┐
                    │       │      │     │  PostgreSQL     │
                    │  ┌────▼────┐ │────►│  (Neon)         │
                    │  │  API    │ │     └────────────────┘
                    │  │ Routes  │ │
                    │  └────┬────┘ │
                    └───────┼──────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
  ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
  │   Hedera     │   │ Cloudflare  │   │    Lit       │
  │   Network    │   │    R2       │   │  Protocol    │
  │              │   │  (files)    │   │  Network     │
  │  HCS Topics  │   │             │   │             │
  │  HTS Tokens  │   │  Encrypted  │   │  Threshold  │
  │  DIDs        │   │  blobs      │   │  MPC keys   │
  │  Smart       │   │             │   │  Access     │
  │  Contracts   │   │             │   │  control    │
  └──────────────┘   └─────────────┘   └─────────────┘
         │
  ┌──────▼──────┐   ┌─────────────┐
  │ x402         │   │  Upstash    │
  │ Facilitator  │   │  Redis      │
  │ (BlockyDevs) │   │  (cache)    │
  └──────────────┘   └─────────────┘
```

### 14.3 Smart Contract Deployment

Two contracts deployed to Hedera EVM:

1. **PaperRevenueSplitter** — Handles x402 revenue distribution per paper
2. **PaymentReceiptRegistry** — Records payment receipts for Lit access verification

Deployment via Hardhat + Hedera JSON-RPC relay:

```bash
npx hardhat deploy --network hedera-testnet
```

---

## 15. Security Architecture

### 15.1 Threat Model & Mitigations

| Threat | Mitigation |
|---|---|
| **Paper content theft from storage** | All non-public content is Lit-encrypted on R2. Useless without Lit Network decryption. |
| **Bypass x402 payment** | Lit access condition independently verifies on-chain payment receipt. Even the platform can't bypass. |
| **Wallet impersonation** | Signature verification on every auth. DID resolution confirms wallet ownership. |
| **Hash tampering** | Client-side hashing verifiable by anyone. On-chain hash is source of truth. |
| **Contract modification after signing** | Any change invalidates all signatures (AC-5). Previous versions on-chain (AC-9). |
| **Review content tampering** | Review hash on-chain. Off-chain content re-hashable for comparison. |
| **Reviewer de-anonymization** | Ratings stored without author identifier. One-way hash for dedup only. |
| **Reputation gaming** | Soulbound tokens — can't transfer or buy reputation. Append-only history. |
| **Revenue split manipulation** | Split contract is immutable per paper. Based on on-chain authorship contract. |
| **Off-chain data loss** | R2 cross-region replication. DB daily backups. On-chain hashes as integrity anchors. |
| **XSS / CSRF** | httpOnly cookies. CSP headers. Input sanitization. |

### 15.2 Data Classification

| Classification | Examples | Storage | On-Chain |
|---|---|---|---|
| **Public** | Published papers (free), authorship contracts, reputation tokens, review criteria, earnings events | DB + R2 (plaintext) | Hash + metadata |
| **Paid Access** | Published papers (paid), datasets | DB + R2 (Lit-encrypted) | Hash only; x402 receipt for access |
| **Restricted** | Private drafts, pre-decision reviews, confidential editor comments | DB + R2 (Lit-encrypted) | Hash only |
| **Sensitive** | ORCID OAuth tokens, wallet association metadata | DB (encrypted columns) | Never |

---

## 16. Scalability Considerations

### 16.1 Vercel Constraints

- **Function timeout:** 60s (Pro). HCS/HTS operations < 5s.
- **Body size:** 4.5MB. PDFs upload directly to R2 via presigned URLs.
- **Cold starts:** Mitigated by edge network. Dashboard loads < 300ms target.
- **Connection pooling:** Neon serverless driver handles this.

### 16.2 x402 Scaling

- Payment verification is fast (facilitator response < 2s)
- Revenue split is one smart contract call per payment
- Cache payment receipts in Redis to avoid redundant Lit verification for repeat access
- Institutional pre-authorization: bulk deposit to a contract, members auto-verify without per-read x402 flow

### 16.3 HTS Token Scaling

- HTS NFT minting: ~$0.05 per token on Hedera
- At 10,000 reviews/month: ~$500/month in HTS fees (acceptable)
- Mirror node queries for token metadata are free and fast
- Reputation computation reads from mirror node → caches in DB

### 16.4 Lit Protocol Scaling

- Lit SDK operations happen client-side (encryption/decryption)
- Lit Network handles key management and condition evaluation
- No server-side bottleneck for Lit operations
- Main concern: Lit Network availability. Mitigate with graceful degradation (show "temporarily unavailable" rather than fail)

---

## 17. Open Questions & Risks

### 17.1 Open Decisions

| # | Question | Recommendation | When |
|---|---|---|---|
| 1 | **x402 facilitator: hosted vs self-hosted?** | Use BlockyDevs' hosted Hedera facilitator for hackathon. Self-host for production. | Hackathon: hosted |
| 2 | **Revenue split: per-access or batched?** | Per-access for transparency. Batch settlement (hourly) for gas efficiency in production. | Hackathon: per-access |
| 3 | **Lit network: which one?** | `cayenne` (testnet) for hackathon. `habanero` or `manzano` for production. | Now |
| 4 | **Paper pricing: author-set or algorithmic?** | Author-set for MVP. Consider algorithmic (based on field, length, citations) in v2. | Author-set |
| 5 | **Institutional access: how?** | v2 feature. Architecture supports it via bulk escrow contract. | Deferred |
| 6 | **USDC on Hedera availability?** | Verify USDC-H availability on testnet. May need to use HBAR for hackathon demo. | Verify ASAP |

### 17.2 Key Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Lit Protocol + Hedera chain support** | Lit may not natively support Hedera as a chain for access conditions | Use EVM-compatible access conditions via Hedera's EVM layer. Test early. |
| **x402 Hedera facilitator maturity** | BlockyDevs facilitator is V1, may have bugs | Test thoroughly. Have fallback: simulate x402 flow with direct HTS transfer for demo. |
| **HTS soulbound enforcement** | HTS doesn't have native "soulbound" flag | Implement via custom fee schedule (prohibitive transfer fee) or admin-controlled transfer. Test token non-transferability. |
| **Smart contract gas costs** | Revenue splitter may have high gas per split | Optimize: batch transfers, minimize storage writes. Hedera gas is cheap but not zero. |
| **Canonical JSON across wallets** | HashPack and MetaMask may serialize differently | Use `json-canonicalize` (RFC 8785) consistently. Test with both wallets. |
| **Hackathon timeline** | 5 weeks for full stack + 3 integrations | Prioritize: (1) x402 paper access, (2) HTS reputation, (3) Lit encryption. Cut Lit if time-constrained. |

---

## Appendix A: Technology Stack Summary

| Concern | Technology | Why |
|---|---|---|
| Frontend | Next.js 14+ (App Router) | Per spec; SSR for public pages, CSR for dashboards |
| Deployment | Vercel | Per spec; native Next.js |
| Blockchain (consensus) | Hedera HCS | Immutable logs, fast finality, low fees |
| Blockchain (tokens) | Hedera HTS | Soulbound reputation NFTs |
| Blockchain (contracts) | Hedera Smart Contracts (EVM) | Revenue splitter, payment receipts, System Contract bridge to HTS |
| Payments | x402 Protocol + Hedera facilitator | Micropayment paper access, HTTP-native |
| Encryption | Lit Protocol | Decentralized access control, threshold encryption |
| Database | PostgreSQL via Neon | Serverless-compatible |
| File storage | Cloudflare R2 | S3-compatible, zero egress, stores Lit-encrypted blobs |
| Cache | Upstash Redis | Payment receipt cache, rate limiting |
| Wallets | HashPack + MetaMask (wagmi) | Per spec |
| Identity | DID:Hedera + ORCID | Per spec |
| Hashing | Web Crypto API | Browser-native SHA-256 |
| Canonical JSON | RFC 8785 (`json-canonicalize`) | Deterministic serialization |
| ORM | Drizzle ORM | Type-safe, lightweight |
| Smart Contract Dev | Hardhat + Hedera JSON-RPC | Standard EVM tooling on Hedera |

## Appendix B: MVP Scope + Hackathon Additions

**Core (from SRS):**
- ✅ FR-1: Authorship Contracts
- ✅ FR-2: Paper Registration
- ✅ FR-3: Versioning & Provenance
- ✅ FR-4: Pre-Registered Peer Review
- ✅ FR-5.1–5.4: Reviewer Reputation
- ✅ FR-6: Reviewer Feedback Transparency
- ✅ FR-7: Retraction display only

**Hackathon Additions (NEW):**
- ✅ x402 micropayment paper access with auto-split revenue
- ✅ HTS soulbound reputation tokens (upgrades FR-5 from DB-only to on-chain)
- ✅ Lit Protocol decentralized access control (upgrades FR-2.5 from server-trust to crypto-enforced)
- ✅ Revenue splitter smart contract (Hedera EVM)
- ✅ Earnings dashboard (new page)
- ✅ Hedera System Contracts (hybrid HTS + EVM)

**Deferred:**
- ❌ FR-5.5 (Sybil resistance) — v2
- ❌ FR-7 write/management — v2
- ❌ FR-8 (Funding-linked timelines) — v2 (architecture-ready via escrow pattern)
- ❌ FR-9 (Fraud insurance) — v3
- ❌ FR-10 (Commercial IP) — v2
- ❌ FR-11 (AI review detection) — v2

## Appendix C: Hedera Service Usage Map

| Hedera Service | How We Use It | Concepts Demonstrated |
|---|---|---|
| **HCS** | 7 domain topics for immutable audit logs | Consensus messaging, append-only logs |
| **HTS** | Soulbound reputation NFTs | Token creation, NFT minting, non-transferability |
| **Smart Contracts** | Revenue splitter, payment receipts | Solidity on Hedera EVM |
| **System Contracts** | Mint HTS tokens from Solidity | Hybrid HTS + EVM approach |
| **DID** | Decentralized identity for all users | did:hedera method |
| **Mirror Node** | Query tokens, verify transactions, read reputation | Off-chain reads of on-chain data |
| **x402** | HTTP-native micropayments for paper access | Hedera's x402 payment scheme |

This demonstrates breadth and depth across Hedera's service offerings — important for hackathon judging.
