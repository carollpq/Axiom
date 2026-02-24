# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

Axiom is a blockchain-backed academic publishing and peer review platform built on Hedera. It enforces authorship contracts, transparent peer review, reviewer reputation, versioned provenance, and journal accountability using cryptographic proofs rather than institutional trust.

### Project Status

The codebase is a **partially functional full-stack application**. The author section has significant backend integration in place; the journal and reviewer sections still use mock data.

**What's working end-to-end (author section):**
- Thirdweb v5 wallet authentication → JWT in httpOnly cookie
- Paper registration: client-side SHA-256 hashing → R2 presigned upload → Lit encryption → DB storage → Hedera HCS anchoring
- Study type selection (original / negative result / replication / replication failed / meta-analysis) in Step 1 of registration wizard
- Access price input in Step 4 of registration wizard (persisted to DB on registration)
- Authorship contract creation + wallet signing (cryptographically verified via viem `verifyMessage`) → HCS anchoring per signature
- Contract modification → signature invalidation: editing a field after signing triggers `PATCH /api/contracts/[id]/reset-signatures`
- Invite token generation: `POST /api/contracts/[id]/invite` mints a real token (7-day expiry) + `/invite/[token]` page for claim/signing
- Paper submission to journal: `POST /api/papers/[id]/submit` → creates `submissions` row → HCS anchor (graceful fallback) → status → `submitted`
- Journal list fetched from DB and shown in Step 4 journal dropdown
- Author dashboard + public explorer fetching real DB data
- Neon PostgreSQL (prod) / configurable via `DATABASE_URL` — schema uses `pgTable` throughout

**What still uses mock data:**
- Journal dashboard (`(journal)/`)
- Reviewer dashboard + review workspace (`(reviewer)/`)
- Invite link generation in contract builder

**What is not yet implemented:**
- Lit Protocol decryption (encrypt works; decrypt not wired into any UI)
- ORCID OAuth (onboarding validates format client-side only; no real OAuth flow or DB write)
- x402 micropayment gate
- HTS soulbound reputation tokens
- Smart contracts (PaperRevenueSplitter, PaymentReceiptRegistry)
- `/verify` public hash verification page
- Hedera mirror node lookups

**Current stack:** Next.js 15 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · Thirdweb v5 · TypeScript strict mode · Neon PostgreSQL/Drizzle ORM · Hedera SDK (HCS) · Lit Protocol SDK (encrypt only) · AWS SDK (Cloudflare R2)

**Planned upgrades:** x402 micropayments · HTS reputation tokens · Solidity smart contracts (Hardhat) · Upstash Redis · Vercel deployment

## Common Commands

```bash
npm run dev                    # Start dev server with Turbopack (http://localhost:3000)
npm run build                  # Production build (requires NEXT_PUBLIC_THIRDWEB_CLIENT_ID)
npx tsc --noEmit               # Type-check without building (use this for quick validation)
npm run lint                   # ESLint
npm run format                 # Prettier formatting
```

## Architecture

### Server-First Page Pattern

Every author page follows this decomposition:

```
src/app/{role}/page.tsx                              # Async Server Component — getSession() + feature queries → initialData
src/app/{role}/loading.tsx                           # Skeleton shown during navigation (Suspense fallback)
src/app/{role}/error.tsx                             # 'use client' error boundary (one per route group)
src/features/{domain}/components/{Name}.client.tsx   # 'use client' boundary — accepts initialData, calls hook
src/features/{domain}/hooks/use{Domain}.ts           # 'use client' hook — pure UI state, accepts initialData params
src/features/{domain}/components/                    # Presentational components (no data fetching)
src/features/{domain}/mappers/{domain}.ts            # Pure mapping functions — safe to import from server or client
```

**The split in one line:** server fetches, client interacts.

```ts
// page.tsx (server) — no 'use client', no hooks
export default async function Page() {
  const wallet = await getSession();
  if (!wallet) redirect('/');
  const raw = listUserPapers(wallet) as unknown as ApiPaper[];
  return <DomainClient initialData={raw.map(mapDbX)} />;
}

// Domain.client.tsx (client boundary)
'use client';
export function DomainClient({ initialData }: Props) {
  const state = useDomain(initialData);   // pure UI state, no fetching
  return <DomainView {...state} />;
}
```

**What stays client-side forever:** wallet signing (`account.signMessage`), file hashing (Web Crypto API), Lit encryption, R2 uploads, `useUser()` / `useActiveAccount()`.

**What stays as API routes:** all mutations (`POST`, `PATCH`, `DELETE`). `GET` routes are kept for external access but no longer hit on initial page load.

**Established domains:** `dashboard` (author-dashboard), `contract`, `paper-registration`, `explorer`, `journal-dashboard`, `reviewer-dashboard`, `review-workspace`, `onboarding`, `shared`

#### Hook Pattern

Each custom hook accepts `initialData` from the server and owns only UI state:

```ts
"use client";
export function useDomain(initialData: DomainData[]) {
  // useState for UI-only state (filters, selected item, modal open, etc.)
  // useMemo for derived/filtered values from initialData
  // handler functions for mutations (call API routes, then refresh local state)
  return { /* flat object of state + derived + handlers */ };
}
```

`useAuthFetch` (`src/shared/hooks/useAuthFetch.ts`) is still used for **mutation-triggered refreshes** (e.g. re-fetching contracts after signing) but is no longer used for initial page data.

#### Client Boundary File Naming

Client boundary components (the `'use client'` files that wrap a page's interactive logic) use the `.client.tsx` suffix:

```
src/features/author/components/dashboard/tabs.shell.client.tsx   # preferred suffix
src/features/author/components/dashboard/papers-table.client.tsx # preferred suffix
```

New client boundary files should use the `.client.tsx` suffix so the boundary is visible at the filesystem level without reading the file.

#### Component Pattern

- Each component gets its own file in `components/{domain}/`
- All components are re-exported from `components/{domain}/index.ts` (barrel export)
- Props interfaces defined at top of each component file
- Components use Tailwind CSS classes for layout + inline `style={{}}` for `rgba()` color values

### Backend Feature Pattern

Server-side data logic is organised in `src/features/{domain}/` (for DB-level domains) and `src/features/author/queries/` (for author-specific query logic):
```
src/features/{domain}/
├── index.ts       # Re-exports
├── queries.ts     # Drizzle read queries
└── actions.ts     # Drizzle write mutations (called from API routes or Server Actions)
```

#### Feature Import Rule — prevent server code leaking into client bundles

Always import from the **sub-file directly**, never from the feature root index:

```ts
// ✅ correct — server-only file, safe in Server Components and API routes
import { listUserPapers } from '@/src/features/papers/queries';
import { createPaper }    from '@/src/features/papers/actions';

// ❌ wrong — root index re-exports everything; bundler may pull server code into client
import { listUserPapers } from '@/src/features/papers';
```

The same rule applies to `src/features/{domain}/mappers/`, `src/shared/lib/db/`, `src/shared/lib/hedera/`, `src/shared/lib/lit/` — import from the specific file, not a parent barrel, when writing client code.

#### Mapper Pattern

Pure data-transformation functions that need to be called from **both** server pages and client hooks live in `src/features/author/mappers/{domain}.ts`. They have no browser dependencies and no side effects, making them safe to import from anywhere.

```
src/features/author/mappers/
├── dashboard.ts   # mapDbPaperToFrontend, computeStats
├── explorer.ts    # mapApiPaperToExplorer
└── contract.ts    # mapDbContractToSigned
```

### Shared Layout

Each role group has its own layout using shared components from `src/shared/components/`:
- `src/app/author/layout.tsx` — Author pages with TopBar (Dashboard, Contract Builder, Paper Registration, Explorer) + Footer
- `src/app/journal/layout.tsx` — Journal pages with journal-specific navigation
- `src/app/reviewer/layout.tsx` — Reviewer pages with reviewer-specific navigation

All layouts use the `RoleShell` component from `src/shared/components/`. Dark theme background (`#1a1816`). Pages should NOT include their own navigation chrome.

### Styling Conventions

- **Tailwind CSS v4** — imported via `@import "tailwindcss"` in `globals.css`, no `tailwind.config.js`
- Layout properties (padding, margin, flex, grid, rounded, font-size) use Tailwind utility classes
- Semi-transparent colors (`rgba(...)`) use inline `style={{}}` since Tailwind v4 arbitrary values can be verbose for these
- Dark theme palette: backgrounds `#1a1816` / `rgba(45,42,38,...)`, text `#d4ccc0` / `#b0a898` / `#8a8070` / `#6a6050`, accents `#c9a44a` (gold) / `#8fbc8f` (green) / `#d4645a` (red) / `#5a7a9a` (blue)
- Font: `font-serif` throughout (Georgia/serif stack)

### Web3 Integration

**Thirdweb v5** handles wallet connection and message signing in the root layout. `context/UserContext.tsx` provides `useUser()` / `useCurrentUser()` hooks for wallet state throughout the app. `lib/auth.ts` issues and verifies JWTs stored as httpOnly cookies.

## Directory Structure (Actual)

All source code lives under `src/`. The `@/` path alias resolves to the project root (i.e. `@/src/...`).

```
src/
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout (ThirdwebProvider, UserProvider, globals)
│   ├── page.tsx                   # Landing page
│   ├── globals.css                # Tailwind v4 import + global styles
│   ├── login/page.tsx             # Login / wallet-connect page
│   ├── onboarding/page.tsx        # Onboarding flow (ORCID step is placeholder)
│   ├── api/
│   │   ├── auth/me/route.ts       # GET: return authenticated user from DB
│   │   ├── activity/route.ts      # GET: activity feed for authenticated user
│   │   ├── contracts/
│   │   │   ├── route.ts           # GET/POST: list + create contracts
│   │   │   └── [id]/
│   │   │       ├── route.ts       # GET/PATCH: contract detail + update
│   │   │       ├── contributors/route.ts  # POST: add contributor
│   │   │       └── sign/route.ts  # POST: sign contract with wallet signature → HCS
│   │   ├── papers/
│   │   │   ├── route.ts           # GET/POST: list + create papers
│   │   │   ├── public/route.ts    # GET: public paper listing (no auth)
│   │   │   └── [id]/
│   │   │       ├── route.ts       # GET/PATCH: paper detail + update
│   │   │       └── versions/route.ts  # POST: create version → R2 upload → HCS anchor
│   │   └── upload/
│   │       └── presigned/route.ts # POST: generate R2 presigned upload URL (15-min expiry)
│   ├── author/                    # Author role group
│   │   ├── layout.tsx             # Author shell (TopBar + Footer)
│   │   ├── loading.tsx            # Top-level Suspense skeleton
│   │   ├── error.tsx              # Error boundary
│   │   ├── page.tsx               # Author dashboard (real DB data)
│   │   ├── contract_builder/page.tsx
│   │   ├── paper_registration/page.tsx
│   │   └── public_explorer/page.tsx
│   ├── journal/                   # Journal role group
│   │   ├── layout.tsx
│   │   └── page.tsx               # Journal dashboard (mock data)
│   └── reviewer/                  # Reviewer role group
│       ├── layout.tsx
│       ├── page.tsx               # Reviewer dashboard (mock data)
│       └── review_workspace/page.tsx

├── features/                      # Domain-organised feature modules
│   ├── author/                    # Author domain (most complete)
│   │   ├── components/
│   │   │   ├── contract/          # ContractBuilderClient + ContractPreview, ContributorRow,
│   │   │   │                      #   ContributorTable, InviteModal, ModificationWarning,
│   │   │   │                      #   PaperSelection, PercentageBar, SignatureProgress, SubmissionGate
│   │   │   ├── dashboard/         # ActivityFeed, PapersTable, PendingActionsList, QuickActions,
│   │   │   │                      #   StatusBadge, activity.section, papers.section, pending.section,
│   │   │   │                      #   stats.section, tabs.shell.client, papers-table.client
│   │   │   ├── explorer/          # ExplorerClient + DetailHeader, DetailTabs, ExplorerList,
│   │   │   │                      #   FilterBar, HashRow, OverviewTab, PaperCard, PaperDetail,
│   │   │   │                      #   ProvenanceTab, RetractionBanner, ReviewsTab, SearchBar,
│   │   │   │                      #   StatusBadge, VersionsTab
│   │   │   ├── onboarding/        # CompleteStep, Header, OrcidStep, RoleSelectionStep
│   │   │   ├── paper-registration/ # PaperRegistrationClient + ConfirmationScreen,
│   │   │   │                      #   ContractLinkingStep, HashDisplay, PaperDetailsStep,
│   │   │   │                      #   ProvenanceStep, RegisterSubmitStep, StepIndicator, StepNavigation
│   │   │   └── skeletons.tsx      # Suspense skeletons (StatsSkeleton, PapersTableSkeleton, etc.)
│   │   ├── hooks/
│   │   │   ├── useContractBuilder.ts   # Signing flow via Thirdweb
│   │   │   ├── useExplorer.ts          # Filter/search/sort/detail state
│   │   │   ├── useOnboarding.ts        # Onboarding flow
│   │   │   └── usePaperRegistration.ts # Hashing → Lit → R2 → API → HCS
│   │   ├── mappers/
│   │   │   ├── contract.ts        # mapDbContractToSigned
│   │   │   ├── dashboard.ts       # mapDbPaperToFrontend, computeStats
│   │   │   └── explorer.ts        # mapApiPaperToExplorer
│   │   ├── mock-data/
│   │   │   ├── contract.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── explorer.ts
│   │   │   └── paper-registration.ts
│   │   ├── queries/
│   │   │   └── activity.ts        # computeActivityData(wallet) → { pendingActions, activity }
│   │   ├── types/
│   │   │   ├── contract.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── explorer.ts
│   │   │   ├── paper-registration.ts
│   │   │   └── index.ts
│   │   └── nav.ts                 # Author navigation link definitions
│   ├── contracts/                 # Contracts DB domain (server-only)
│   │   ├── index.ts
│   │   ├── queries.ts             # listUserContracts, getContractById, getContributors
│   │   └── actions.ts             # createContract, addContributor, signContributor, updateContractStatus
│   ├── papers/                    # Papers DB domain (server-only)
│   │   ├── index.ts
│   │   ├── queries.ts             # listUserPapers, getPaperById, getPublicPapers, getPaperVersions
│   │   └── actions.ts             # createPaper, updatePaper, createPaperVersion
│   ├── users/                     # Users DB domain (server-only)
│   │   ├── index.ts
│   │   └── queries.ts             # getOrCreateUser, getUserByWallet
│   ├── journal/                   # Journal feature (mock data)
│   │   └── (15 component files + index.ts)
│   └── reviewer/                  # Reviewer feature (mock data)
│       ├── reviewer-dashboard/    # (13 component files + index.ts)
│       └── review-workspace/      # (11 component files + index.ts)

└── shared/                        # Cross-domain shared code
    ├── components/                # Shared UI components
    │   ├── Badge.tsx
    │   ├── DashboardHeader.tsx    # role="author"|"journal"|"reviewer" → correct title/subtitle
    │   ├── Footer.tsx
    │   ├── RoleShell.tsx          # Role group shell layout wrapper
    │   ├── StatCard.tsx
    │   ├── StatusBadge.tsx
    │   ├── TabBar.tsx
    │   ├── TopBar.tsx
    │   └── index.ts               # Barrel export
    ├── context/
    │   └── UserContext.tsx        # Wallet + user session state (useUser hook)
    ├── hooks/
    │   ├── useAuthFetch.ts        # fetch() with JWT cookie; mutation-triggered refreshes only
    │   ├── useCurrentUser.ts      # Alias for useUser()
    │   ├── useJournalDashboard.ts # Journal dashboard state (mock data)
    │   ├── useReviewerDashboard.ts
    │   └── useReviewWorkspace.ts
    ├── lib/
    │   ├── api.ts                 # Typed fetch helpers for client → API routes
    │   ├── format.ts              # Date/number formatting utilities
    │   ├── hashing.ts             # hashFile(), hashString(), canonicalJson() — Web Crypto API
    │   ├── status-colors.ts       # Paper status → colour mapping
    │   ├── status-map.ts          # DB status → display label mapping
    │   ├── storage.ts             # Cloudflare R2 client (AWS SDK S3-compatible)
    │   ├── thirdweb.ts            # Thirdweb SDK client configuration
    │   ├── validation.ts          # Zod schemas / input validation utilities
    │   ├── auth/
    │   │   ├── actions.ts         # Server Actions: login, logout
    │   │   └── auth.ts            # JWT creation + verification, AUTH_COOKIE constant
    │   ├── db/
    │   │   ├── index.ts           # Drizzle client (SQLite dev / Neon prod)
    │   │   ├── schema.ts          # Full Drizzle schema: all tables + relations
    │   │   └── seed.ts            # Dev seed data
    │   ├── hedera/
    │   │   ├── client.ts          # Hedera SDK client (AccountId + PrivateKey, testnet/mainnet)
    │   │   └── hcs.ts             # submitHcsMessage(topicId, payload) → { txId, consensusTimestamp }
    │   ├── lit/
    │   │   ├── client.ts          # LitNodeClient singleton with auto-connect
    │   │   ├── access-control.ts  # buildAuthorCondition(), buildAllowlistCondition(), buildNoAccessCondition()
    │   │   ├── encrypt.ts         # encryptFile() — encrypts before R2 upload, returns ciphertext + metadata
    │   │   └── decrypt.ts         # decryptFile() — NOT YET WIRED INTO ANY UI
    │   └── mock-data/             # Shared mock data (journal + reviewer)
    │       ├── journal-dashboard.ts
    │       ├── review-workspace.ts
    │       └── reviewer-dashboard.ts
    └── types/
        ├── api.ts                 # Shared API response types (ApiPaper, ApiContract, etc.)
        ├── journal-dashboard.ts
        ├── review-workspace.ts
        ├── reviewer-dashboard.ts
        └── shared.ts

docs/
├── architecture.md
├── data-fetching.md
├── engineering-standards.md
├── forms.md
├── server-actions.md
└── streaming.md
```

## Coding Conventions

- **TypeScript strict mode** throughout.
- **Server Components** by default. Use `'use client'` only when the component needs browser APIs or interactivity.
- **Imports:** Use `@/` path alias for project root (e.g., `@/src/features/author/hooks/useContractBuilder`, `@/src/shared/components`). Always import from sub-file paths for server-only modules — never from feature root barrels (see Feature Import Rule above).
- **File naming:** Component files use PascalCase (`ContributorRow.tsx`). Client boundary files use `.client.tsx` suffix (`dashboard.client.tsx`). Hooks use camelCase (`useContractBuilder.ts`). Types and mock data use kebab-case (`paper-registration.ts`). Domain directories use kebab-case (`paper-registration/`) or plain lowercase (`contract/`, `explorer/`).
- **Dynamic route segments:** Use `[id]` not `[paperId]` / `[contractId]` — keep route params generic.
- **No localStorage or sessionStorage.** State lives in React context (client) or httpOnly cookies (auth).
- **Environment variables:** Access via `process.env` in server code only. Client-side env vars must be prefixed with `NEXT_PUBLIC_`.
- **API routes that use Hedera SDK** must include `export const runtime = 'nodejs'` (Hedera SDK is Node.js only).
- **Graceful degradation:** Hedera HCS, Lit encryption, and R2 uploads all fall back gracefully if env vars are missing — they log a warning and continue without the integration. This allows development without all credentials configured.
- **Auth in server code:** Call `getSession()` from `@/src/shared/lib/auth/auth` to get the wallet address. Redirect to `'/login'` if null. Never trust wallet address from the request body — always derive it from the verified JWT.
- **Validation:** Use `createInsertSchema(table)` from `drizzle-zod` to generate Zod schemas from Drizzle table definitions. Do not hand-write validation schemas that duplicate the DB schema.

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
- `src/shared/lib/lit/decrypt.ts` exists and is implemented but is not called anywhere — private paper content is unreadable for non-authors until this is wired into the explorer detail view.
- ORCID onboarding only validates the ORCID format client-side (`validateOrcidFormat`). No OAuth token exchange, no public.orcid.org lookup, and the value is never persisted to the DB.

---

## Remaining Work (Priority Order)

### Tier 1 — Blocks core author functionality
1. Wire `src/shared/lib/lit/decrypt.ts` into the explorer detail view (authors reading their own private papers)

### Tier 2 — Impacts usability
2. Real ORCID OAuth flow (currently only validates format; no token exchange, no DB write)
3. Upload progress UI for R2 uploads

### Tier 3 — Architecture / hackathon differentiators
4. x402 micropayment gate for paper content
5. HTS soulbound reputation token minting
6. Smart contract deployment (PaperRevenueSplitter, PaymentReceiptRegistry)
7. `/verify` public hash verification page
8. Hedera mirror node lookups for receipt verification

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

**Encryption timing:** Encrypt files client-side BEFORE upload. The on-chain hash must be of the **original (unencrypted)** content for verification to work. ✅ Already enforced in `src/features/author/hooks/usePaperRegistration.ts`.

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

All SHA-256 hashing uses `src/shared/lib/hashing.ts` (Web Crypto API):
- `hashFile(file: File): Promise<string>`
- `hashString(content: string): Promise<string>`
- `canonicalJson(obj: object): string` — RFC 8785 deterministic serialization

**Critical:** Always use `canonicalJson()` before hashing contracts. Never use `JSON.stringify()` directly for anything that will be hashed.

### Things to Watch Out For

- **Canonical JSON determinism:** Different JSON serialization = different hashes = broken signature verification.
- **Hedera SDK is Node.js only.** Add `export const runtime = 'nodejs'` in any route handler using the Hedera SDK.
- **Presigned URL expiry:** R2 presigned upload URLs expire in 15 minutes.
- **Contract modification cascade:** Changing ANY field on a contract after ANY signature must invalidate ALL signatures. The UI shows a warning but does not yet enforce this programmatically (see `src/features/author/hooks/useContractBuilder.ts`).
- **Reviewer anonymity:** The `reviewerRatings` table deliberately has no `authorDid` or `raterId` column. Never add one.
- **Confidential editor comments** are stored off-chain only and NEVER included in the review hash that goes on-chain.
- **HCS message size limit:** ~6KB. Keep message payloads lean (hashes + metadata, not full content).
- **Lit encryption timing:** Encrypt BEFORE upload. On-chain hash = hash of original unencrypted content.
- **Revenue split immutability:** Once a `PaperRevenueSplitter` config is registered for a paper, it cannot be changed.
- **Soulbound token transfers:** HTS reputation tokens must be configured as non-transferable.
