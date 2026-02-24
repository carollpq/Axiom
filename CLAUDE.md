# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

Axiom is a blockchain-backed academic publishing and peer review platform built on Hedera. It enforces authorship contracts, transparent peer review, reviewer reputation, versioned provenance, and journal accountability using cryptographic proofs rather than institutional trust.

### Project Status

The codebase is a **partially functional full-stack application**. The author section has significant backend integration in place; the journal and reviewer sections still use mock data.

**What's working end-to-end (author section):**
- Thirdweb v5 wallet authentication → JWT in httpOnly cookie
- Paper registration: client-side SHA-256 hashing → R2 presigned upload → Lit encryption → DB storage → Hedera HCS anchoring
- Authorship contract creation + wallet signing → HCS anchoring per signature
- Author dashboard + public explorer fetching real DB data
- SQLite (dev) database via Drizzle ORM with full schema

**What still uses mock data:**
- Journal dashboard (`(journal)/`)
- Reviewer dashboard + review workspace (`(reviewer)/`)
- Activity feed and pending actions on author dashboard
- Invite link generation in contract builder

**What is not yet implemented:**
- Lit Protocol decryption (encrypt works; decrypt not wired into any UI)
- Paper submission to journal (Step 4 of wizard is a no-op)
- ORCID OAuth (onboarding step is a placeholder)
- Contract modification → signature invalidation cascade
- x402 micropayment gate
- HTS soulbound reputation tokens
- Smart contracts (PaperRevenueSplitter, PaymentReceiptRegistry)
- `/verify` public hash verification page
- Hedera mirror node lookups

**Current stack:** Next.js 15 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · Thirdweb v5 · TypeScript strict mode · SQLite/Drizzle ORM (dev) · Hedera SDK (HCS) · Lit Protocol SDK (encrypt only) · AWS SDK (Cloudflare R2)

**Planned upgrades:** Switch SQLite → PostgreSQL (Neon) · x402 micropayments · HTS reputation tokens · Solidity smart contracts (Hardhat) · Upstash Redis · Vercel deployment

## Common Commands

```bash
npm run dev                    # Start dev server with Turbopack (http://localhost:3000)
npm run build                  # Production build (requires NEXT_PUBLIC_THIRDWEB_CLIENT_ID)
npx tsc --noEmit               # Type-check without building (use this for quick validation)
npm run lint                   # ESLint
npm run format                 # Prettier formatting
```

## Architecture

### 4-Layer Decomposition Pattern

Every page follows a consistent decomposition:

```
types/{domain}.ts              # TypeScript interfaces for the domain
lib/mock-data/{domain}.ts      # Hardcoded mock data (used as fallback or for journal/reviewer)
hooks/use{Domain}.ts           # "use client" hook: all state, derived values, handlers
components/{domain}/           # Small, focused components (barrel-exported via index.ts)
app/(...)/page.tsx             # Thin orchestration: imports hook + components, ~40-120 lines
```

**Established domains:** `dashboard` (author-dashboard), `contract`, `paper-registration`, `explorer`, `journal-dashboard`, `reviewer-dashboard`, `review-workspace`, `onboarding`, `shared`

#### Hook Pattern

Each custom hook follows the same shape:

```ts
"use client";
export function useDomain() {
  // useState for all local state
  // useMemo for derived/filtered values
  // handler functions for user actions
  return { /* flat object of state + derived + handlers */ };
}
```

Hooks that need authenticated API calls use `useAuthFetch` (`hooks/useAuthFetch.ts`) which attaches the JWT cookie automatically.

#### Component Pattern

- Each component gets its own file in `components/{domain}/`
- All components are re-exported from `components/{domain}/index.ts` (barrel export)
- Props interfaces defined at top of each component file
- Components use Tailwind CSS classes for layout + inline `style={{}}` for `rgba()` color values

### Backend Feature Pattern

Server-side logic is organised in `features/{domain}/`:
```
features/{domain}/
├── index.ts       # Re-exports
├── queries.ts     # Drizzle read queries
└── actions.ts     # Drizzle write mutations (called from API routes or Server Actions)
```

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

**Thirdweb v5** handles wallet connection and message signing in the root layout. `context/UserContext.tsx` provides `useUser()` / `useCurrentUser()` hooks for wallet state throughout the app. `lib/auth.ts` issues and verifies JWTs stored as httpOnly cookies.

## Directory Structure (Actual)

```
app/
├── layout.tsx                 # Root layout (ThirdwebProvider, UserProvider, global styles)
├── page.tsx                   # Landing page
├── globals.css                # Tailwind v4 import + global styles
├── actions/
│   └── auth.ts                # Server Actions: login, logout
├── api/
│   ├── auth/me/route.ts       # GET: return authenticated user from DB
│   ├── activity/route.ts      # GET: activity feed for authenticated user
│   ├── contracts/
│   │   ├── route.ts           # GET/POST: list + create contracts
│   │   └── [id]/
│   │       ├── route.ts       # GET/PATCH: contract detail + update
│   │       ├── contributors/route.ts  # POST: add contributor
│   │       └── sign/route.ts  # POST: sign contract with wallet signature → HCS
│   ├── papers/
│   │   ├── route.ts           # GET/POST: list + create papers
│   │   ├── public/route.ts    # GET: public paper listing (no auth)
│   │   └── [id]/
│   │       ├── route.ts       # GET/PATCH: paper detail + update
│   │       └── versions/route.ts  # POST: create version → R2 upload → HCS anchor
│   └── upload/
│       └── presigned/route.ts # POST: generate R2 presigned upload URL (15-min expiry)
├── (author)/
│   ├── layout.tsx             # Shared author shell (TopBar + Footer)
│   ├── page.tsx               # Author dashboard
│   ├── contract_builder/page.tsx
│   ├── paper_registration/page.tsx
│   └── public_explorer/page.tsx
├── (journal)/
│   ├── layout.tsx
│   └── journal/page.tsx       # Journal dashboard (mock data)
└── (reviewer)/
    ├── layout.tsx
    ├── reviewer/page.tsx       # Reviewer dashboard (mock data)
    └── review_workspace/page.tsx  # Review workspace (mock data)

context/
└── UserContext.tsx             # Wallet + user session state (useUser hook)

features/
├── contracts/
│   ├── index.ts
│   ├── queries.ts             # listUserContracts, getContractById, getContributors
│   └── actions.ts             # createContract, addContributor, signContributor, updateContractStatus
├── papers/
│   ├── index.ts
│   ├── queries.ts             # listUserPapers, getPaperById, getPublicPapers, getPaperVersions
│   └── actions.ts             # createPaper, updatePaper, createPaperVersion
└── users/
    ├── index.ts
    └── queries.ts             # getOrCreateUser, getUserByWallet

lib/
├── api.ts                     # Typed fetch helpers for client → API routes
├── auth.ts                    # JWT creation + verification, AUTH_COOKIE constant
├── format.ts                  # Date/number formatting utilities
├── hashing.ts                 # hashFile(), hashString(), canonicalJson() — Web Crypto API
├── nav.ts                     # Navigation link definitions
├── status-colors.ts           # Paper status → colour mapping
├── status-map.ts              # DB status → display label mapping
├── storage.ts                 # Cloudflare R2 client (AWS SDK S3-compatible)
├── thirdweb.ts                # Thirdweb SDK client configuration
├── validation.ts              # Zod schemas / input validation utilities
├── db/
│   ├── index.ts               # Drizzle client (SQLite dev / Neon prod)
│   ├── schema.ts              # Full Drizzle schema: all tables + relations
│   └── seed.ts                # Dev seed data
├── hedera/
│   ├── client.ts              # Hedera SDK client (AccountId + PrivateKey, testnet/mainnet)
│   └── hcs.ts                 # submitHcsMessage(topicId, payload) → { txId, consensusTimestamp }
├── lit/
│   ├── client.ts              # LitNodeClient singleton with auto-connect
│   ├── access-control.ts      # buildAuthorCondition(), buildAllowlistCondition(), buildNoAccessCondition()
│   ├── encrypt.ts             # encryptFile() — encrypts before R2 upload, returns ciphertext + metadata
│   └── decrypt.ts             # decryptFile() — NOT YET WIRED INTO ANY UI
└── mock-data/
    ├── dashboard.ts
    ├── contract.ts
    ├── explorer.ts
    ├── journal-dashboard.ts
    ├── paper-registration.ts
    ├── review-workspace.ts
    └── reviewer-dashboard.ts

hooks/
├── useAuthFetch.ts            # fetch() wrapper that attaches JWT cookie; used by all data hooks
├── useCurrentUser.ts          # Alias for useUser() from UserContext
├── useDashboard.ts            # Author dashboard: fetches /api/papers + /api/activity; falls back to mock
├── useContractBuilder.ts      # Contract builder: full signing flow with Thirdweb account.signMessage()
├── usePaperRegistration.ts    # Paper registration: hashing → Lit encrypt → R2 upload → API → HCS
├── useExplorer.ts             # Explorer: fetches /api/papers/public; filter/search/sort/detail state
├── useJournalDashboard.ts     # Journal dashboard state (mock data)
├── useReviewerDashboard.ts    # Reviewer dashboard state (mock data)
├── useReviewWorkspace.ts      # Review workspace state (mock data)
└── useOnboarding.ts           # Onboarding flow state (ORCID step is placeholder)

types/
├── api.ts                     # Shared API response types (ApiPaper, ApiContract, etc.)
├── dashboard.ts
├── contract.ts
├── paper-registration.ts
├── explorer.ts
├── journal-dashboard.ts
├── reviewer-dashboard.ts
├── review-workspace.ts
└── shared.ts

components/
├── author-dashboard/          # ActivityFeed, PapersTable, PendingActionsList, QuickActions, StatusBadge (6 files)
├── contract/                  # ContractPreview, ContributorRow, ContributorTable, InviteModal,
│                              #   ModificationWarning, PaperSelection, PercentageBar,
│                              #   SignatureProgress, SubmissionGate (10 files)
├── explorer/                  # DetailHeader, DetailTabs, ExplorerList, FilterBar, HashRow,
│                              #   OverviewTab, PaperCard, PaperDetail, ProvenanceTab,
│                              #   RetractionBanner, ReviewsTab, SearchBar, StatusBadge,
│                              #   VersionsTab (15 files)
├── journal-dashboard/         # 15 files (mock data)
├── reviewer-dashboard/        # 13 files (mock data)
├── review-workspace/          # 11 files (mock data)
├── paper-registration/        # ConfirmationScreen, ContractLinkingStep, HashDisplay,
│                              #   PaperDetailsStep, ProvenanceStep, RegisterSubmitStep,
│                              #   StepIndicator, StepNavigation (9 files)
├── onboarding/                # CompleteStep, Header, OrcidStep, RoleSelectionStep (4 files)
└── shared/                    # Badge, Footer, RoleShell, StatCard, StatusBadge, TabBar, TopBar (8 files)

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
- **API routes that use Hedera SDK** must include `export const runtime = 'nodejs'` (Hedera SDK is Node.js only).
- **Graceful degradation:** Hedera HCS, Lit encryption, and R2 uploads all fall back gracefully if env vars are missing — they log a warning and continue without the integration. This allows development without all credentials configured.

## Environment Variables

Required in `.env.local`:

```
# Auth (required)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID
AUTH_PRIVATE_KEY                   # Thirdweb auth signer key
NEXT_PUBLIC_APP_DOMAIN             # e.g. localhost:3000

# Database (required)
DATABASE_URL                       # SQLite file path for dev (e.g. file:./dev.db) or Neon URL for prod

# Hedera (optional — graceful fallback if missing)
HEDERA_NETWORK                     # testnet | mainnet
HEDERA_OPERATOR_ID
HEDERA_OPERATOR_KEY
HCS_TOPIC_PAPERS
HCS_TOPIC_CONTRACTS
HCS_TOPIC_SUBMISSIONS

# Cloudflare R2 (optional — graceful fallback if missing)
S3_BUCKET
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
S3_ENDPOINT

# Lit Protocol (optional — graceful fallback if missing)
NEXT_PUBLIC_LIT_NETWORK            # datil-dev | datil-test | datil

# Planned / not yet implemented
HCS_TOPIC_CRITERIA, HCS_TOPIC_REVIEWS, HCS_TOPIC_DECISIONS, HCS_TOPIC_RETRACTIONS, HCS_TOPIC_EARNINGS
HTS_REPUTATION_TOKEN_ID
REVENUE_SPLITTER_CONTRACT_ADDRESS, PAYMENT_RECEIPT_CONTRACT_ADDRESS
X402_FACILITATOR_URL
ORCID_CLIENT_ID, ORCID_CLIENT_SECRET, ORCID_REDIRECT_URI
GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
```

## Known Issues

- `npm run build` fails without `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` set. Use `npx tsc --noEmit` for type-checking during development.
- `lib/lit/decrypt.ts` exists and is implemented but is not called anywhere — private paper content is unreadable for non-authors until this is wired into the explorer detail view.
- Invite links in the contract builder (`handleInvite()` in `useContractBuilder.ts`) generate a hardcoded mock URL — real invite token generation and a `/invite/[token]` page are not yet built.
- Paper submission to a journal (Step 4 of the paper registration wizard) is a UI no-op — no `POST /api/papers/[id]/submit` route exists yet.
- Activity feed and pending actions on the author dashboard fall back to hardcoded mock data rather than querying DB state.
- The contract modification → signature invalidation cascade shows a UI warning but does not programmatically reset signatures when a contract is edited.
- ORCID OAuth in the onboarding flow is a placeholder component with no real integration.

---

## Remaining Work (Priority Order)

### Tier 1 — Blocks core author functionality
1. Wire `lib/lit/decrypt.ts` into the explorer detail view (authors reading their own private papers)
2. Cryptographically verify wallet signatures in `POST /api/contracts/[id]/sign`
3. Implement contract modification → signature invalidation in `useContractBuilder.ts`
4. Build real invite token generation + `/invite/[token]` page
5. Implement `POST /api/papers/[id]/submit` and wire it to Step 4 of the registration wizard

### Tier 2 — Impacts usability
6. Compute real activity feed and pending actions from DB state
7. Add study type selection (negative result / replication / meta-analysis) to paper registration Step 1
8. Real ORCID OAuth flow
9. Upload progress UI for R2 uploads

### Tier 3 — Architecture / hackathon differentiators
10. x402 micropayment gate for paper content
11. HTS soulbound reputation token minting
12. Smart contract deployment (PaperRevenueSplitter, PaymentReceiptRegistry)
13. `/verify` public hash verification page
14. Hedera mirror node lookups for receipt verification
15. Switch DATABASE_URL from SQLite to Neon PostgreSQL for production

---

## Architecture Reference

> The sections below describe the **target system design** as spec for remaining implementation work.

### Core Principle: Hash-on-chain, content-off-chain

No paper content, review text, or PII is stored on Hedera. Only SHA-256 hashes and metadata references go on-chain. All hashing is done client-side via Web Crypto API (`SubtleCrypto.digest`) so users can verify what gets anchored.

### Data Flow Pattern (for all on-chain writes)

1. Client computes SHA-256 hash in the browser
2. Client sends hash + data to API
3. API validates, stores off-chain (DB), submits HCS message to Hedera
4. API receives HCS receipt (txId, consensus timestamp)
5. API updates off-chain record with txId
6. Client receives confirmation with txId for verification

### Hedera HCS Topics

Domain-scoped HCS topics (env vars `HCS_TOPIC_*`). Each is an append-only log:

- `papers` — draft registrations, version anchoring ✅ implemented
- `contracts` — authorship contract creation, signatures, fullySigned events ✅ implemented
- `submissions` — paper submission events (not yet used)
- `criteria` — journal review criteria publication (not yet used)
- `reviews` — review hash anchoring (not yet used)
- `decisions` — accept/reject/revise with justification (not yet used)
- `retractions` — retraction records (not yet used)
- `earnings` — revenue distribution events (not yet used)

### Lit Protocol — Decentralized Access Control

Paper content is Lit-encrypted before upload to R2. Only users who meet on-chain conditions can decrypt.

**Access conditions by paper state:**

| Paper State | Who Can Decrypt | Lit Condition |
|---|---|---|
| Private Draft | Author(s) on the contract | `walletAddress IN authorWallets` |
| Under Review | Authors + reviewers + editor | `walletAddress IN allowedWallets` |
| Published (paid) | Anyone with valid x402 receipt | `hasValidReceipt(paperHash, wallet)` on PaymentReceiptRegistry |
| Published (free) | Anyone | No encryption (plaintext on R2) |
| Retracted | No one | `false` (content sealed) |

**Encryption timing:** Encrypt files client-side BEFORE upload. The on-chain hash must be of the **original (unencrypted)** content for verification to work. ✅ Already enforced in `usePaperRegistration.ts`.

### x402 Micropayment Integration

Revenue split per paper access: Authors 70% · Reviewers 15% · Journal 10% · Platform 5%.

Key components (not yet built):
- `lib/x402/middleware.ts` — payment gate for paper content API routes
- `lib/x402/facilitator.ts` — client for BlockyDevs' Hedera x402 facilitator
- `PaperRevenueSplitter` smart contract — automatic revenue distribution
- `PaymentReceiptRegistry` smart contract — on-chain proof of payment for Lit access

### HTS Soulbound Reputation Tokens

Reviewer reputation as non-transferable HTS NFTs. Token: `RESEARCH_CHAIN_REPUTATION (RCR)`.

Event types: `review_completed`, `review_late`, `review_quality`, `editor_rating`, `author_rating`, `paper_published`, `paper_retracted`.

Reputation score: `0.30 × Timeliness + 0.25 × Editor Rating + 0.25 × Author Feedback + 0.20 × Publication Outcome`.

### Database Schema

Drizzle ORM. Dev: SQLite (`lib/db/schema.ts`). Prod target: Neon PostgreSQL.

Key conventions:
- All on-chain-anchored records store `hederaTxId` and `hederaTimestamp` columns.
- `reputationEvents` is append-only — never update or delete rows.
- `reviewerRatings` deliberately has NO author reference column (anonymity by design). Never add one.
- Paper status enum: `draft` → `registered` → `contract_pending` → `submitted` → `under_review` → `revision_requested` → `published` → `retracted`.
- Papers have a `studyType` field: `original`, `meta_analysis`, `negative_result`, `replication`, `replication_failed`.

### Client-Side Hashing

All SHA-256 hashing uses `lib/hashing.ts` (Web Crypto API):
- `hashFile(file: File): Promise<string>`
- `hashString(content: string): Promise<string>`
- `canonicalJson(obj: object): string` — RFC 8785 deterministic serialization

**Critical:** Always use `canonicalJson()` before hashing contracts. Never use `JSON.stringify()` directly for anything that will be hashed.

### Things to Watch Out For

- **Canonical JSON determinism:** Different JSON serialization = different hashes = broken signature verification.
- **Hedera SDK is Node.js only.** Add `export const runtime = 'nodejs'` in any route handler using the Hedera SDK.
- **Presigned URL expiry:** R2 presigned upload URLs expire in 15 minutes.
- **Contract modification cascade:** Changing ANY field on a contract after ANY signature must invalidate ALL signatures. The UI shows a warning but does not yet enforce this programmatically.
- **Reviewer anonymity:** The `reviewerRatings` table deliberately has no `authorDid` or `raterId` column. Never add one.
- **Confidential editor comments** are stored off-chain only and NEVER included in the review hash that goes on-chain.
- **HCS message size limit:** ~6KB. Keep message payloads lean (hashes + metadata, not full content).
- **Lit encryption timing:** Encrypt BEFORE upload. On-chain hash = hash of original unencrypted content.
- **Revenue split immutability:** Once a `PaperRevenueSplitter` config is registered for a paper, it cannot be changed.
- **Soulbound token transfers:** HTS reputation tokens must be configured as non-transferable.
