# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

Research Chain is a blockchain-backed academic publishing and peer review platform built on Hedera. It enforces authorship contracts, transparent peer review, reviewer reputation, versioned provenance, and journal accountability using cryptographic proofs rather than institutional trust.

### Project Status

The codebase is currently a **frontend prototype** — all pages are fully designed and interactive but use hardcoded mock data. There is no backend, database, Hedera integration, or wallet connection yet. The "Planned Architecture" section below describes the target system design.

All three role dashboards (author, journal, reviewer) and the review workspace are implemented with mock data.

**Current stack:** Next.js 15 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · Thirdweb v5 (wallet provider, not yet wired) · TypeScript strict mode

**Planned additions:** Hedera (HCS + HTS + DID + Smart Contracts) · x402 Protocol (micropayments) · Lit Protocol (access control) · PostgreSQL (Neon) · Drizzle ORM · Cloudflare R2 · Upstash Redis · Hardhat · Vercel

## Common Commands

```bash
npm run dev                    # Start dev server with Turbopack (http://localhost:3000)
npm run build                  # Production build (currently requires NEXT_PUBLIC_THIRDWEB_CLIENT_ID)
npx tsc --noEmit               # Type-check without building (use this for quick validation)
npm run lint                   # ESLint
npm run format                 # Prettier formatting
```

## Frontend Architecture

### 4-Layer Decomposition Pattern

Every page follows a consistent decomposition:

```
types/{domain}.ts              # TypeScript interfaces for the domain
lib/mock-data/{domain}.ts      # Hardcoded mock data (typed exports)
hooks/use{Domain}.ts           # "use client" hook: all state, derived values, handlers
components/{domain}/           # Small, focused components (barrel-exported via index.ts)
app/(...)/page.tsx             # Thin orchestration: imports hook + components, ~40-120 lines
```

**Established domains:** `dashboard` (author-dashboard), `contract`, `paper-registration`, `explorer`, `journal-dashboard`, `reviewer-dashboard`, `review-workspace`, `onboarding`, `shared`

#### Hook Pattern

Each custom hook (`useDashboard`, `useContractBuilder`, `usePaperRegistration`, `useExplorer`, `useJournalDashboard`, `useReviewerDashboard`, `useReviewWorkspace`, `useOnboarding`) follows the same shape:

```ts
"use client";
export function useDomain() {
  // useState for all local state
  // useMemo for derived/filtered values
  // handler functions for user actions
  return { /* flat object of state + derived + handlers */ };
}
```

#### Component Pattern

- Each component gets its own file in `components/{domain}/`
- All components are re-exported from `components/{domain}/index.ts` (barrel export)
- Props interfaces defined at top of each component file
- Components use Tailwind CSS classes for layout + inline `style={{}}` for `rgba()` color values

### Shared Layout

Each role group has its own layout using shared components from `components/shared/`:
- `app/(author)/layout.tsx` — Author pages with TopBar (Dashboard, Contract Builder, Paper Registration, Explorer, Onboarding) + Footer
- `app/(journal)/layout.tsx` — Journal pages with journal-specific navigation
- `app/(reviewer)/layout.tsx` — Reviewer pages with reviewer-specific navigation

All layouts use the `RoleShell` component from `components/shared/`. Dark theme background (`#1a1816`). Pages should NOT include their own navigation chrome.

### Styling Conventions

- **Tailwind CSS v4** — imported via `@import "tailwindcss"` in `globals.css`, no `tailwind.config.js`
- Layout properties (padding, margin, flex, grid, rounded, font-size) use Tailwind utility classes
- Semi-transparent colors (`rgba(...)`) use inline `style={{}}` since Tailwind v4 arbitrary values can be verbose for these
- Dark theme palette: backgrounds `#1a1816` / `rgba(45,42,38,...)`, text `#d4ccc0` / `#b0a898` / `#8a8070` / `#6a6050`, accents `#c9a44a` (gold) / `#8fbc8f` (green) / `#d4645a` (red) / `#5a7a9a` (blue)
- Font: `font-serif` throughout (Georgia/serif stack)

### Web3 Integration

**Thirdweb v5** is installed and configured as the wallet provider in the root layout (`app/layout.tsx`). Requires `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` env var. Currently provides the provider wrapper but wallet connection flows are not yet implemented in pages.

## Directory Structure (Actual)

```
app/
├── layout.tsx                 # Root layout (ThirdwebProvider, global styles)
├── page.tsx                   # Landing page
├── globals.css                # Tailwind v4 import + global styles
├── (author)/                  # Author role pages
│   ├── layout.tsx             # Shared author shell (TopBar + Footer)
│   ├── page.tsx               # Author dashboard
│   ├── contract_builder/      # Authorship contract builder
│   ├── paper_registration/    # Paper registration wizard (4 steps)
│   └── public_explorer/       # Public paper explorer + detail view
├── (journal)/                 # Journal/editor pages
│   ├── layout.tsx             # Shared journal shell
│   └── journal/               # Journal dashboard (submission pipeline, criteria, decisions)
└── (reviewer)/                # Reviewer pages
    ├── layout.tsx             # Shared reviewer shell
    ├── reviewer/              # Reviewer dashboard (reputation, assigned reviews)
    └── review_workspace/      # Review workspace (criteria evaluation, review submission)

components/
├── author-dashboard/          # Author dashboard components (12 files)
├── contract/                  # Contract builder components (10 files)
├── explorer/                  # Paper explorer + detail components (15 files)
├── journal-dashboard/         # Journal dashboard components (15 files)
├── reviewer-dashboard/        # Reviewer dashboard components (12 files)
├── review-workspace/          # Review workspace components (11 files)
├── paper-registration/        # Paper registration wizard components (9 files)
├── onboarding/                # Onboarding flow components (4 files)
└── shared/                    # Shared UI: TopBar, Footer, RoleShell, Badge, StatCard, TabBar (7 files)

hooks/
├── useDashboard.ts            # Author dashboard state management
├── useContractBuilder.ts      # Contract builder state management
├── usePaperRegistration.ts    # Paper registration wizard state
├── useExplorer.ts             # Explorer search/filter/detail state
├── useJournalDashboard.ts     # Journal dashboard state (pipeline, criteria, decisions)
├── useReviewerDashboard.ts    # Reviewer dashboard state (reputation, reviews)
├── useReviewWorkspace.ts      # Review workspace state (criteria eval, comments)
└── useOnboarding.ts           # Onboarding flow state

types/
├── dashboard.ts               # Author dashboard domain types
├── contract.ts                # Contract builder domain types
├── paper-registration.ts      # Paper registration domain types
├── explorer.ts                # Explorer domain types
├── journal-dashboard.ts       # Journal dashboard domain types
├── reviewer-dashboard.ts      # Reviewer dashboard domain types
├── review-workspace.ts        # Review workspace domain types
└── shared.ts                  # Shared types across domains

lib/
├── thirdweb.ts                # Thirdweb SDK configuration
├── validation.ts              # Validation utilities
└── mock-data/
    ├── dashboard.ts           # Mock papers, actions, activities
    ├── contract.ts            # Mock drafts, contributors, known users
    ├── paper-registration.ts  # Mock contracts, journals, step labels
    ├── explorer.ts            # Mock papers with full detail data
    ├── journal-dashboard.ts   # Mock submissions, criteria, decisions
    ├── review-workspace.ts    # Mock review assignments, criteria, comments
    └── reviewer-dashboard.ts  # Mock reputation, assigned/completed reviews

docs/
└── architecture.md            # Full architecture document (v2)
```

## Coding Conventions

- **TypeScript strict mode** throughout.
- **Server Components** by default. Use `'use client'` only when the component needs browser APIs or interactivity.
- **Imports:** Use `@/` path alias for project root (e.g., `@/hooks/useDashboard`, `@/components/contract`).
- **File naming:** Component files use PascalCase (`ContributorRow.tsx`). Hooks use camelCase (`useContractBuilder.ts`). Types and mock data use kebab-case (`paper-registration.ts`). Domain directories use kebab-case (`paper-registration/`) or plain lowercase (`contract/`, `explorer/`).
- **No localStorage or sessionStorage.** State lives in React context (client) or httpOnly cookies (auth).
- **Environment variables:** Access via `process.env` in server code only. Client-side env vars must be prefixed with `NEXT_PUBLIC_`.

## Known Issues

- `npm run build` fails without `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` set (thirdweb provider in root layout). Use `npx tsc --noEmit` for type-checking during development.

---

## Planned Architecture

> The sections below describe the **target system design** — none of this is implemented yet. They serve as a specification for future backend/integration work.

### Core Principle: Hash-on-chain, content-off-chain

No paper content, review text, or PII is stored on Hedera. Only SHA-256 hashes and metadata references go on-chain. All hashing is done client-side via Web Crypto API (`SubtleCrypto.digest`) so users can verify what gets anchored.

### Data Flow Pattern (for all on-chain writes)

Every action that anchors data on Hedera follows a two-phase pattern:

1. Client computes SHA-256 hash in the browser
2. Client sends hash + data to API
3. API validates, stores off-chain (DB), submits HCS message to Hedera
4. API receives HCS receipt (txId, consensus timestamp)
5. API updates off-chain record with txId
6. Client receives confirmation with txId for verification

### Hedera HCS Topics

The platform uses domain-scoped HCS topics. Topic IDs are in env vars (`HCS_TOPIC_PAPERS`, `HCS_TOPIC_CONTRACTS`, etc.). Each topic is an append-only log. Messages are structured JSON:

- `papers` — draft registrations, version anchoring
- `contracts` — authorship contract creation, individual signatures, fully-signed events
- `submissions` — paper submission events
- `criteria` — journal review criteria publication
- `reviews` — review hash anchoring
- `decisions` — accept/reject/revise with justification
- `retractions` — retraction records
- `earnings` — revenue distribution events (x402 payment splits)

### x402 Micropayment Integration

x402 is an HTTP-native payment protocol for gating full paper access. When a client requests a paid resource, the server responds with HTTP 402 containing payment requirements. The client pays and retries with a payment header. A facilitator verifies and settles the payment on Hedera.

**Revenue split per paper access (70/15/10/5):**
- **Authors (70%)** — split per authorship contract percentages (on-chain)
- **Reviewers (15%)** — split equally among assigned reviewers
- **Journal (10%)** — coordination service fee
- **Platform (5%)** — infrastructure sustainability

**Key components:**
- `lib/x402/middleware.ts` — x402 payment gate middleware for paper content API routes
- `lib/x402/facilitator.ts` — client for the x402 facilitator (BlockyDevs' Hedera x402 facilitator for testnet)
- `PaperRevenueSplitter` smart contract (Solidity on Hedera EVM) — automatic payment distribution
- `PaymentReceiptRegistry` smart contract — on-chain proof of payment (used by Lit Protocol for decryption access)

**Access tiers:** Free (abstract/metadata), Micropayment ($0.50-$2.00 via x402), Institutional (bulk deposit), Open Access (funder escrow covers cost).

### Lit Protocol — Decentralized Access Control

Paper content is Lit-encrypted before upload to R2. Only users who meet on-chain conditions can decrypt. Even if R2 is compromised, encrypted blobs are useless without Lit Network cooperation.

**Access conditions by paper state:**

| Paper State | Who Can Decrypt | Lit Condition |
|---|---|---|
| Private Draft | Author(s) on the contract | `walletAddress IN authorWallets` |
| Under Review | Authors + reviewers + editor | `walletAddress IN allowedWallets` |
| Published (paid) | Anyone with valid x402 receipt | `hasValidReceipt(paperHash, wallet)` on PaymentReceiptRegistry |
| Published (free) | Anyone | No encryption (plaintext on R2) |
| Retracted | No one | `false` (content sealed) |

**Key components:**
- `lib/lit/access-control.ts` — create/update Lit access conditions per paper state
- `lib/lit/encrypt.ts` — encrypt files client-side via Lit SDK
- `lib/lit/decrypt.ts` — decrypt files after condition verification
- `LitProvider` — React context provider for Lit SDK initialization

### HTS Soulbound Reputation Tokens

Reviewer reputation is represented as non-transferable (soulbound) HTS NFTs. Each reputation event mints a token to the reviewer's account with metadata encoding the event details.

**Properties:** Portable (any platform can read), non-transferable (can't be bought/sold), journal-independent, verifiable on-chain.

**Token:** `RESEARCH_CHAIN_REPUTATION (RCR)` — NFT type, unlimited supply, non-transferable.

**Event types:** `review_completed`, `review_late`, `review_quality`, `editor_rating`, `author_rating`, `paper_published`, `paper_retracted`.

**Reputation score computation** (hourly cron): `0.30 × Timeliness + 0.25 × Editor Rating + 0.25 × Author Feedback + 0.20 × Publication Outcome`. Reads HTS token metadata from mirror node.

**Reputation → Revenue flywheel:** Better reviews → higher reputation → more review assignments → more papers earning x402 revenue → more income from 15% reviewer share.

### Smart Contracts (Hedera EVM)

Two Solidity contracts deployed on Hedera EVM:

1. **`PaperRevenueSplitter`** — receives x402 payments and distributes to authors (per contribution %), reviewers (equal split), journal, and platform. Registered per paper at publication time with immutable split config.

2. **`PaymentReceiptRegistry`** — records on-chain proof that a wallet has paid for a paper. Used as a Lit Protocol access condition so decryption is trustless. Function: `hasValidReceipt(address reader, bytes32 paperHash) → bool`.

Both interact with HTS via Hedera System Contracts for token operations.

### Wallet Adapter

`lib/wallet/adapter.ts` will define a `WalletAdapter` interface that abstracts HashPack and MetaMask behind a common API: `connect()`, `disconnect()`, `signMessage()`, `signTransaction()`, `signX402Payment()`, `getNetwork()`. All components will use this interface, never wallet SDKs directly.

### Session Management

No localStorage. Authentication uses wallet signatures → JWT in httpOnly cookie. On page refresh, the cookie persists; the frontend silently reconnects the wallet and validates the address matches the JWT claim.

### Database

PostgreSQL via Neon with Drizzle ORM. Schema will live in `lib/db/schema.ts`.

**Key tables:** `users`, `papers`, `paper_versions`, `authorship_contracts`, `contract_contributors`, `journals`, `submissions`, `review_criteria`, `reviews`, `reviewer_ratings`, `reputation_events`, `reputation_scores`, `notifications`, `activity_log`, `retractions`, `earnings_events`, `earnings_recipients`, `payment_receipts`.

**Important conventions:**
- All on-chain-anchored records store `hedera_tx_id` and `hedera_timestamp` columns.
- `reputation_events` is append-only — never update or delete rows.
- `reviewer_ratings` deliberately has NO author reference column (anonymity by design).
- `earnings_events` records each x402 payment; `earnings_recipients` records per-recipient splits.
- `payment_receipts` stores on-chain receipt references for Lit access verification.
- Paper status enum: `draft` → `registered` → `contract_pending` → `submitted` → `under_review` → `revision_requested` → `published` → `retracted`.
- Papers have a `study_type` field: `original`, `meta_analysis`, `negative_result`, `replication`, `replication_failed`. Replication types link to the original paper via `replication_of_hash`.

### Client-Side Hashing

All SHA-256 hashing will use `lib/hashing.ts` wrapping Web Crypto API:
- `hashFile(file: File): Promise<string>` — hash uploaded files
- `hashString(content: string): Promise<string>` — hash arbitrary strings
- `canonicalJson(obj: object): string` — deterministic JSON serialization (RFC 8785, sorted keys, no whitespace)

**Critical:** Authorship contracts are hashed from canonical JSON. The canonical representation must be identical across all clients. Always use `canonicalJson()` before hashing contracts. Never use `JSON.stringify()` directly for anything that will be hashed.

### File Uploads

Paper PDFs, datasets, and environment specs upload directly to Cloudflare R2 via presigned URLs (not through the API serverless function — Vercel has a 4.5MB body limit). Object key in R2 IS the SHA-256 hash (content-addressed storage). Non-public files are stored **Lit-encrypted** — even a full R2 breach exposes nothing.

### Authorship Contract Signing

Contract content → `canonicalJson()` → SHA-256 → wallet signs hash → signature + DID sent to API → HCS message per signature → when all signed, HCS "fullySigned" message with all signatures.

Any modification after a signature invalidates ALL existing signatures. Previous contract versions are kept on-chain (append-only).

### Review Criteria Enforcement

Journals publish criteria on-chain BEFORE review begins. If all criteria are met by reviewers, the system displays a binding publication obligation to the editor. Rejection after criteria approval requires an on-chain justification that becomes permanently visible.

### Verification Tool

The `/verify` page provides standalone hash verification — anyone can paste a paper hash and verify its on-chain proof without logging in. Reads from Hedera mirror node to confirm registration timestamp, authorship contract, review history, and version provenance.

### Negative Result & Replication Study Support

Papers can be tagged with `study_type` at registration: `original`, `meta_analysis`, `negative_result`, `replication`, `replication_failed`. The study type is recorded in the HCS message and is immutable. Replication studies link to the original paper. The explorer supports filtering by study type and displays replication chains on paper detail views.

### State Providers (planned)

- `LitProvider` — initializes Lit SDK, manages Lit session signatures
- `NotificationProvider` — real-time notification delivery

### Roles and Access Control

Users can hold multiple roles simultaneously: `author`, `reviewer`, `editor`. The active role determines which dashboard routes are accessible.

- **Public (no auth):** Landing page, public paper explorer, hash verification (`/verify`)
- **Author:** Paper registration, contract builder, submission, paper management, earnings dashboard
- **Reviewer:** Review workspace, reputation dashboard, assigned reviews, earnings dashboard
- **Editor:** Journal dashboard, criteria publishing, reviewer assignment, accept/reject decisions

### Planned Environment Variables

Required in `.env.local` (when backend is implemented):

```
NEXT_PUBLIC_THIRDWEB_CLIENT_ID
HEDERA_NETWORK, HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY
HCS_TOPIC_PAPERS, HCS_TOPIC_CONTRACTS, HCS_TOPIC_SUBMISSIONS,
HCS_TOPIC_CRITERIA, HCS_TOPIC_REVIEWS, HCS_TOPIC_DECISIONS, HCS_TOPIC_RETRACTIONS,
HCS_TOPIC_EARNINGS
HTS_REPUTATION_TOKEN_ID
REVENUE_SPLITTER_CONTRACT_ADDRESS, PAYMENT_RECEIPT_CONTRACT_ADDRESS
X402_FACILITATOR_URL
LIT_NETWORK
DATABASE_URL
S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT
ORCID_CLIENT_ID, ORCID_CLIENT_SECRET, ORCID_REDIRECT_URI
GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
JWT_SECRET
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
```

### Things to Watch Out For (when implementing backend)

- **Canonical JSON determinism:** Different JSON serialization = different hashes = broken signature verification.
- **Hedera SDK is Node.js only.** Set `export const runtime = 'nodejs'` in route handlers that use the Hedera SDK.
- **Presigned URL expiry:** R2 presigned upload URLs expire in 15 minutes.
- **Contract modification cascade:** Changing ANY field on a contract after ANY signature invalidates ALL signatures. The UI must make this extremely clear before allowing edits.
- **Reviewer anonymity in ratings:** The `reviewer_ratings` table deliberately has no `author_did` or `rater_id` column. Never add one.
- **Confidential editor comments** in reviews are stored off-chain only and NEVER included in the review hash that goes on-chain.
- **HCS message size limit:** HCS messages have a ~6KB limit. Keep message payloads lean (hashes + metadata, not full content).
- **x402 payment verification:** Always verify payments through the facilitator before serving content. Cache verified receipts in Redis to avoid re-verification on subsequent requests.
- **Lit encryption timing:** Encrypt files client-side BEFORE upload. The on-chain hash must be of the original (unencrypted) content for verification to work.
- **Revenue split immutability:** Once a `PaperRevenueSplitter` config is registered for a paper, it cannot be changed. Ensure all contributors are correct at publication time.
- **Soulbound token transfers:** HTS reputation tokens must be configured as non-transferable. Verify token configuration prevents secondary market trading.
