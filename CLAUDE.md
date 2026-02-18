# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

Research Chain is a blockchain-backed academic publishing and peer review platform built on Hedera. It enforces authorship contracts, transparent peer review, reviewer reputation, versioned provenance, and journal accountability using cryptographic proofs rather than institutional trust.

**Stack:** Next.js 14+ (App Router) · Hedera (HCS + DID) · PostgreSQL (Neon) · Cloudflare R2 · Drizzle ORM · Upstash Redis · Vercel

## Common Commands

```bash
npm run dev                    # Start dev server (http://localhost:3000)
npm run build                  # Production build
npm run lint                   # ESLint
npm test                       # Run all tests
npm test -- --watch            # Watch mode
npm run db:generate            # Generate Drizzle migrations from schema changes
npm run db:migrate             # Apply migrations to database
npm run db:studio              # Open Drizzle Studio (visual DB browser)
npm run hedera:init-topics     # Create HCS topics on Hedera (one-time setup)
```

## Architecture

### Core Principle: Hash-on-chain, content-off-chain

No paper content, review text, or PII is stored on Hedera. Only SHA-256 hashes and metadata references go on-chain. All hashing is done client-side via Web Crypto API (`SubtleCrypto.digest`) so users can verify what gets anchored.

### Directory Structure

```
app/
├── (public)/                  # No-auth pages: landing, public paper explorer
├── (auth)/connect/            # Wallet connect + onboarding flow
├── (dashboard)/               # Authenticated, role-gated pages
│   ├── layout.tsx             # Shared shell: top bar, role switcher, notifications
│   ├── author/                # Author dashboard, contract builder, paper registration
│   ├── reviewer/              # Reviewer dashboard, review workspace
│   ├── editor/                # Journal dashboard (submission pipeline, criteria, decisions)
│   └── settings/              # Profile, identity management, reviewer ratings
└── api/                       # Route handlers (serverless functions)
    ├── auth/                  # Wallet verification, ORCID OAuth, session
    ├── papers/                # Paper CRUD, version management
    ├── contracts/             # Authorship contract CRUD, signing
    ├── reviews/               # Review assignment, submission, rating
    ├── journals/              # Journal management, criteria, decisions
    ├── hedera/                # On-chain verification proxy
    └── cron/                  # Scheduled: reputation recompute, deadline checks

components/
├── wallet/                    # WalletConnectButton, WalletSelector, WalletStatus
├── identity/                  # OrcidLinkButton, DidDisplay
├── hedera/                    # TransactionLink, HashDisplay, OnChainBadge
├── paper/                     # PaperCard, PaperStatusBadge, ProvenancePanel, VersionGraph
├── contract/                  # ContributorTable, SignatureStatus, ContractPreview
├── review/                    # CriteriaChecklist, ReviewForm, MethodologyReminder
├── dashboard/                 # DashboardShell, SummaryCard, ActivityFeed, PendingActions
└── ui/                        # DataTable, SearchBar, FileUploadWithHash

lib/
├── hedera/
│   ├── client.ts              # Hedera SDK client init (uses HEDERA_OPERATOR_ID/KEY)
│   ├── hcs.ts                 # HCS topic message submission
│   ├── did.ts                 # DID creation, resolution, document updates
│   ├── topics.ts              # Topic ID registry constants
│   └── verify.ts              # Mirror node queries for hash verification
├── wallet/
│   ├── adapter.ts             # WalletAdapter interface
│   ├── hashpack.ts            # HashPack implementation
│   └── metamask.ts            # MetaMask implementation (ethers.js/wagmi)
├── hashing.ts                 # hashFile(), hashString(), canonicalJson()
├── db/
│   ├── schema.ts              # Drizzle schema (all tables)
│   ├── index.ts               # DB client export
│   └── queries/               # Domain-specific query modules
├── storage.ts                 # S3/R2 presigned URL generation
└── auth.ts                    # JWT sign/verify, session helpers

providers/
├── WalletProvider.tsx         # Wallet connection state, adapter instance
├── AuthProvider.tsx            # User profile, DID, roles, JWT session
└── RoleProvider.tsx            # Active role context, role switching
```

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

### Wallet Adapter

`lib/wallet/adapter.ts` defines a `WalletAdapter` interface that abstracts HashPack and MetaMask behind a common API: `connect()`, `disconnect()`, `signMessage()`, `signTransaction()`, `getNetwork()`. All components use this interface, never wallet SDKs directly.

### Session Management

No localStorage. Authentication uses wallet signatures → JWT in httpOnly cookie. On page refresh, the cookie persists; the frontend silently reconnects the wallet and validates the address matches the JWT claim.

## Database

PostgreSQL via Neon with Drizzle ORM. Schema is in `lib/db/schema.ts`.

**Key tables:** `users`, `papers`, `paper_versions`, `authorship_contracts`, `contract_contributors`, `journals`, `submissions`, `review_criteria`, `reviews`, `reviewer_ratings`, `reputation_events`, `reputation_scores`, `notifications`, `activity_log`, `retractions`.

**Important conventions:**
- All on-chain-anchored records store `hedera_tx_id` and `hedera_timestamp` columns.
- `reputation_events` is append-only — never update or delete rows.
- `reviewer_ratings` deliberately has NO author reference column (anonymity by design, FR-6.3).
- Paper status enum: `draft` → `registered` → `contract_pending` → `submitted` → `under_review` → `revision_requested` → `published` → `retracted`.

When modifying schema, run `npm run db:generate` then `npm run db:migrate`.

## Key Implementation Details

### Client-Side Hashing

All SHA-256 hashing uses `lib/hashing.ts` which wraps Web Crypto API. Three functions:
- `hashFile(file: File): Promise<string>` — hash uploaded files
- `hashString(content: string): Promise<string>` — hash arbitrary strings
- `canonicalJson(obj: object): string` — deterministic JSON serialization (RFC 8785 via `json-canonicalize` package, sorted keys, no whitespace)

**Critical:** Authorship contracts are hashed from canonical JSON. The canonical representation must be identical across all clients. Always use `canonicalJson()` before hashing contracts.

### File Uploads

Paper PDFs, datasets, and environment specs upload directly to Cloudflare R2 via presigned URLs (not through the API serverless function — Vercel has a 4.5MB body limit). The flow is:

1. Client computes hash
2. Client calls API for presigned PUT URL
3. Client uploads directly to R2
4. Object key in R2 IS the SHA-256 hash (content-addressed storage)

### Authorship Contract Signing

Contract content → `canonicalJson()` → SHA-256 → wallet signs hash → signature + DID sent to API → HCS message per signature → when all signed, HCS "fullySigned" message with all signatures.

Any modification after a signature invalidates ALL existing signatures. Previous contract versions are kept on-chain (append-only).

### Review Criteria Enforcement

Journals publish criteria on-chain BEFORE review begins. If all criteria are met by reviewers, the system displays a binding publication obligation to the editor. Rejection after criteria approval requires an on-chain justification that becomes permanently visible.

### Reputation Computation

Reputation scores are recomputed hourly via Vercel cron (`/api/cron/reputation`). Inputs: review timeliness, editor ratings, author feedback (anonymized), post-publication outcomes. The `reputation_events` table is the source of truth (append-only); `reputation_scores` is a computed materialized view.

## Coding Conventions

- **TypeScript strict mode** throughout.
- **Drizzle ORM** for all database access — no raw SQL except in migrations.
- **Server Components** by default. Use `'use client'` only when the component needs browser APIs (wallet, hashing, interactivity).
- **Route Handlers** (not Pages API routes) for all API endpoints.
- **Error handling:** API routes return consistent `{ error: string, code: string }` shape on failure. Hedera submissions are wrapped in try/catch with off-chain rollback on HCS failure.
- **Naming:** Files use kebab-case. Components use PascalCase. Database columns use snake_case. API routes match REST conventions.
- **Imports:** Use `@/` path alias for project root (e.g., `@/lib/hedera/hcs`, `@/components/ui/DataTable`).
- **Environment variables:** Access via `process.env` in server code only. Client-side env vars must be prefixed with `NEXT_PUBLIC_`.
- **No localStorage or sessionStorage.** State lives in React context (client) or httpOnly cookies (auth).

## Roles and Access Control

Users can hold multiple roles simultaneously: `author`, `reviewer`, `editor`. The active role is managed by `RoleProvider` and determines which dashboard routes are accessible. The `(dashboard)/layout.tsx` enforces role-gated routing.

- **Public (no auth):** Landing page, public paper explorer, hash verification
- **Author:** Paper registration, contract builder, submission, paper management
- **Reviewer:** Review workspace, reputation dashboard, assigned reviews
- **Editor:** Journal dashboard, criteria publishing, reviewer assignment, accept/reject decisions

## Testing

- Use the Hedera **testnet** for development. Never point dev environments at mainnet.
- Test wallet flows with HashPack testnet wallet and MetaMask configured for Hedera testnet.
- ORCID has a sandbox environment (`sandbox.orcid.org`) — use it for dev.
- For contract signing tests, you need multiple wallet accounts to simulate co-author signatures.

## Environment Variables

Required in `.env.local`:

```
HEDERA_NETWORK, HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY
HCS_TOPIC_PAPERS, HCS_TOPIC_CONTRACTS, HCS_TOPIC_SUBMISSIONS,
HCS_TOPIC_CRITERIA, HCS_TOPIC_REVIEWS, HCS_TOPIC_DECISIONS, HCS_TOPIC_RETRACTIONS
DATABASE_URL
S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT
ORCID_CLIENT_ID, ORCID_CLIENT_SECRET, ORCID_REDIRECT_URI
GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
JWT_SECRET
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
```

## Things to Watch Out For

- **Canonical JSON determinism:** Different JSON serialization = different hashes = broken signature verification. Always use `canonicalJson()` from `lib/hashing.ts`. Never use `JSON.stringify()` directly for anything that will be hashed.
- **Hedera SDK is Node.js only.** API routes must use Node.js runtime, not Vercel Edge Runtime. Set `export const runtime = 'nodejs'` in route handlers that use the Hedera SDK.
- **Presigned URL expiry:** R2 presigned upload URLs expire in 15 minutes. The client must upload promptly after requesting one.
- **Contract modification cascade:** Changing ANY field on a contract after ANY signature invalidates ALL signatures. The UI must make this extremely clear before allowing edits.
- **Reviewer anonymity in ratings:** The `reviewer_ratings` table deliberately has no `author_did` or `rater_id` column. Never add one. The `rating_hash` is a one-way hash used only for deduplication (one rating per review).
- **Confidential editor comments** in reviews are stored off-chain only and NEVER included in the review hash that goes on-chain.
- **HCS message size limit:** HCS messages have a ~6KB limit. Keep message payloads lean (hashes + metadata, not full content).