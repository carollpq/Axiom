# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

Research Chain is a blockchain-backed academic publishing and peer review platform built on Hedera. It enforces authorship contracts, transparent peer review, reviewer reputation, versioned provenance, and journal accountability using cryptographic proofs rather than institutional trust.

### Project Status

The codebase is currently a **frontend prototype** — all pages are fully designed and interactive but use hardcoded mock data. There is no backend, database, Hedera integration, or wallet connection yet. The "Planned Architecture" section below describes the target system design.

**Current stack:** Next.js 15 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · Thirdweb v5 (wallet provider, not yet wired) · TypeScript strict mode

**Planned additions:** Hedera (HCS + DID) · PostgreSQL (Neon) · Drizzle ORM · Cloudflare R2 · Upstash Redis · Vercel

## Common Commands

```bash
npm run dev                    # Start dev server with Turbopack (http://localhost:3000)
npm run build                  # Production build (currently requires NEXT_PUBLIC_THIRDWEB_CLIENT_ID)
npx tsc --noEmit               # Type-check without building (use this for quick validation)
npm run lint                   # ESLint
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

**Established domains:** `dashboard`, `contract`, `paper-registration`, `explorer`

#### Hook Pattern

Each custom hook (`useDashboard`, `useContractBuilder`, `usePaperRegistration`, `useExplorer`) follows the same shape:

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

`app/(author)/layout.tsx` is a Server Component that wraps all author pages with:
- **TopBar** — logo, navigation links (Dashboard, Contract Builder, Paper Registration, Explorer, Onboarding), wallet status
- **Footer** — branding, copyright
- Dark theme background (`#1a1816`)

All page content renders between TopBar and Footer. Pages should NOT include their own navigation chrome.

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
│   ├── layout.tsx             # Shared shell: TopBar + Footer
│   ├── page.tsx               # Author dashboard
│   ├── contract_builder/      # Authorship contract builder
│   ├── paper_registration/    # Paper registration wizard (4 steps)
│   └── public_explorer/       # Public paper explorer + detail view
├── (journal)/                 # Journal/editor pages (placeholder)
└── (reviewer)/                # Reviewer pages (placeholder)

components/
├── contract/                  # Contract builder components (12 files)
├── dashboard/                 # Dashboard components
├── explorer/                  # Paper explorer + detail components (14 files)
├── onboarding/                # Onboarding flow components
└── paper-registration/        # Paper registration wizard components (8 files)

hooks/
├── useDashboard.ts            # Dashboard state management
├── useContractBuilder.ts      # Contract builder state management
├── usePaperRegistration.ts    # Paper registration wizard state
└── useExplorer.ts             # Explorer search/filter/detail state

types/
├── dashboard.ts               # Dashboard domain types
├── contract.ts                # Contract builder domain types
├── paper-registration.ts      # Paper registration domain types
└── explorer.ts                # Explorer domain types

lib/
└── mock-data/
    ├── dashboard.ts           # Mock papers, actions, activities
    ├── contract.ts            # Mock drafts, contributors, known users
    ├── paper-registration.ts  # Mock contracts, journals, step labels
    └── explorer.ts            # Mock papers with full detail data
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
- `(journal)/` and `(reviewer)/` route groups exist but are empty — no pages implemented yet.

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

### Wallet Adapter

`lib/wallet/adapter.ts` will define a `WalletAdapter` interface that abstracts HashPack and MetaMask behind a common API: `connect()`, `disconnect()`, `signMessage()`, `signTransaction()`, `getNetwork()`. All components will use this interface, never wallet SDKs directly.

### Session Management

No localStorage. Authentication uses wallet signatures → JWT in httpOnly cookie. On page refresh, the cookie persists; the frontend silently reconnects the wallet and validates the address matches the JWT claim.

### Database

PostgreSQL via Neon with Drizzle ORM. Schema will live in `lib/db/schema.ts`.

**Key tables:** `users`, `papers`, `paper_versions`, `authorship_contracts`, `contract_contributors`, `journals`, `submissions`, `review_criteria`, `reviews`, `reviewer_ratings`, `reputation_events`, `reputation_scores`, `notifications`, `activity_log`, `retractions`.

**Important conventions:**
- All on-chain-anchored records store `hedera_tx_id` and `hedera_timestamp` columns.
- `reputation_events` is append-only — never update or delete rows.
- `reviewer_ratings` deliberately has NO author reference column (anonymity by design).
- Paper status enum: `draft` → `registered` → `contract_pending` → `submitted` → `under_review` → `revision_requested` → `published` → `retracted`.

### Client-Side Hashing

All SHA-256 hashing will use `lib/hashing.ts` wrapping Web Crypto API:
- `hashFile(file: File): Promise<string>` — hash uploaded files
- `hashString(content: string): Promise<string>` — hash arbitrary strings
- `canonicalJson(obj: object): string` — deterministic JSON serialization (RFC 8785, sorted keys, no whitespace)

**Critical:** Authorship contracts are hashed from canonical JSON. The canonical representation must be identical across all clients. Always use `canonicalJson()` before hashing contracts. Never use `JSON.stringify()` directly for anything that will be hashed.

### File Uploads

Paper PDFs, datasets, and environment specs upload directly to Cloudflare R2 via presigned URLs (not through the API serverless function — Vercel has a 4.5MB body limit). Object key in R2 IS the SHA-256 hash (content-addressed storage).

### Authorship Contract Signing

Contract content → `canonicalJson()` → SHA-256 → wallet signs hash → signature + DID sent to API → HCS message per signature → when all signed, HCS "fullySigned" message with all signatures.

Any modification after a signature invalidates ALL existing signatures. Previous contract versions are kept on-chain (append-only).

### Review Criteria Enforcement

Journals publish criteria on-chain BEFORE review begins. If all criteria are met by reviewers, the system displays a binding publication obligation to the editor. Rejection after criteria approval requires an on-chain justification that becomes permanently visible.

### Reputation Computation

Reputation scores are recomputed hourly via Vercel cron (`/api/cron/reputation`). Inputs: review timeliness, editor ratings, author feedback (anonymized), post-publication outcomes. The `reputation_events` table is the source of truth (append-only); `reputation_scores` is a computed materialized view.

### Roles and Access Control

Users can hold multiple roles simultaneously: `author`, `reviewer`, `editor`. The active role determines which dashboard routes are accessible.

- **Public (no auth):** Landing page, public paper explorer, hash verification
- **Author:** Paper registration, contract builder, submission, paper management
- **Reviewer:** Review workspace, reputation dashboard, assigned reviews
- **Editor:** Journal dashboard, criteria publishing, reviewer assignment, accept/reject decisions

### Planned Environment Variables

Required in `.env.local` (when backend is implemented):

```
NEXT_PUBLIC_THIRDWEB_CLIENT_ID
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

### Things to Watch Out For (when implementing backend)

- **Canonical JSON determinism:** Different JSON serialization = different hashes = broken signature verification.
- **Hedera SDK is Node.js only.** Set `export const runtime = 'nodejs'` in route handlers that use the Hedera SDK.
- **Presigned URL expiry:** R2 presigned upload URLs expire in 15 minutes.
- **Contract modification cascade:** Changing ANY field on a contract after ANY signature invalidates ALL signatures. The UI must make this extremely clear before allowing edits.
- **Reviewer anonymity in ratings:** The `reviewer_ratings` table deliberately has no `author_did` or `rater_id` column. Never add one.
- **Confidential editor comments** in reviews are stored off-chain only and NEVER included in the review hash that goes on-chain.
- **HCS message size limit:** HCS messages have a ~6KB limit. Keep message payloads lean (hashes + metadata, not full content).
