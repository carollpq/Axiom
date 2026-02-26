# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

Axiom is a blockchain-backed academic publishing and peer review platform built on Hedera. It focuses on making the **review process** fair, transparent, and accountable — without disrupting journal revenue models. Journals publish review criteria on-chain, reviewers build portable soulbound reputation, authors get real-time updates and the right to rebut unfair reviews, and all commitments are cryptographically enforced.

**Hackathon:** Hedera Hello Future: Apex 2026

### Project Status

The codebase is a **partially functional full-stack application**. The researcher section has significant backend integration; editor and reviewer sections still use mock data.

**What's working end-to-end (researcher section):**
- Thirdweb v5 wallet authentication → JWT in httpOnly cookie
- Paper registration: client-side SHA-256 hashing → R2 presigned upload → Lit encryption → DB storage → Hedera HCS anchoring
- Study type selection (original / negative result / replication / replication failed / meta-analysis) in Step 1 of registration wizard
- Authorship contract creation + wallet signing (verified via viem `verifyMessage`) → HCS anchoring per signature
- Contract modification → signature invalidation: editing after signing triggers `PATCH /api/contracts/[id]/reset-signatures`
- Invite token generation: `POST /api/contracts/[id]/invite` mints token (7-day expiry) + `/invite/[token]` claim page
- Paper submission to journal: `POST /api/papers/[id]/submit` → creates `submissions` row → HCS anchor → status → `submitted`
- Journal list fetched from DB in Step 4 dropdown
- Researcher dashboard + public explorer fetching real DB data
- Neon PostgreSQL (prod) / SQLite (dev) via `DATABASE_URL`

**What still uses mock data:**
- Editor dashboard (`(editor)/`)
- Reviewer dashboard + review workspace (`(reviewer)/`)

**Recently completed (UI/infra):**
- Editor UI fully redesigned to match researcher page visual style (DashboardHeader, flat stat cards, section label conventions, sidebar panel titles)
- Real PDF viewer implemented in editor three-column views (`PdfViewer` using react-pdf v10 / pdfjs-dist v5); shows placeholder until `fileUrl` is populated from presigned R2 URLs

**What is not yet implemented:**
- Pre-registered review criteria (journal publishes on-chain) — **TOP PRIORITY**
- Review submission workflow (reviewer evaluates criteria) — **TOP PRIORITY**
- HTS soulbound reputation token minting — **TOP PRIORITY**
- Rebuttal phase (researcher challenges unfair reviews)
- Timeline enforcement with deadline tracking
- Real-time researcher status updates / notifications
- Reviewer search by reputation score
- Lit Protocol decryption (encrypt works; decrypt not wired into UI)
- ORCID OAuth (onboarding validates format client-side only)
- `/verify` public hash verification page
- Hedera mirror node lookups

**Current stack:** Next.js 15 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · Thirdweb v5 · TypeScript strict mode · Neon PostgreSQL/Drizzle ORM · Hedera SDK (HCS) · Lit Protocol SDK (encrypt only) · AWS SDK (Cloudflare R2) · react-pdf v10 (pdfjs-dist v5)

## Common Commands

```bash
npm run dev                    # Start dev server with Turbopack (http://localhost:3000)
npm run build                  # Production build (requires NEXT_PUBLIC_THIRDWEB_CLIENT_ID)
npx tsc --noEmit               # Type-check without building (use for quick validation)
npm run lint                   # ESLint
npm run format                 # Prettier formatting
```

## Architecture

### Core Focus: Review Fairness

The platform's value proposition centers on making the review process fair and accountable. The key differentiators:

1. **Pre-registered review criteria** — Journals publish criteria on HCS before review begins. If a paper meets all required criteria, the journal is bound to publish or provide public justification.
2. **Soulbound reviewer reputation** — HTS NFTs minted per review event. Portable, non-transferable, cross-journal.
3. **Rebuttal phase** — Authors can challenge unfair reviews before final rejection.
4. **Enforced timelines** — Deadlines tracked with on-chain anchoring. Late reviews = negative reputation tokens.
5. **Transparent post-decision reviews** — After final decision, anonymized review comments become public.

**What we do NOT change:** Journal revenue models, paywalls, subscriptions, or APCs. This is critical for adoption — journals gain tools without losing revenue.

### Server-First Page Pattern

Every page follows this decomposition:

```
src/app/{role}/page.tsx                              # Async Server Component — getSession() + queries → initialData
src/app/{role}/loading.tsx                           # Skeleton (Suspense fallback)
src/app/{role}/error.tsx                             # 'use client' error boundary
src/features/{domain}/components/{Name}.client.tsx   # 'use client' boundary — accepts initialData
src/features/{domain}/hooks/use{Domain}.ts           # 'use client' hook — UI state only
src/features/{domain}/components/                    # Presentational components
src/features/{domain}/mappers/{domain}.ts            # Pure mapping functions
```

**The split:** server fetches, client interacts.

**What stays client-side forever:** wallet signing (`account.signMessage`), file hashing (Web Crypto API), Lit encryption, R2 uploads, `useUser()` / `useActiveAccount()`.

**What stays as API routes:** all mutations (`POST`, `PATCH`, `DELETE`).

#### Hook Pattern

Each custom hook accepts `initialData` from the server and owns only UI state:

```ts
"use client";
export function useDomain(initialData: DomainData[]) {
  // useState for UI-only state (filters, selected item, modal open, etc.)
  // useMemo for derived/filtered values
  // handler functions for mutations (call API routes, then refresh)
  return { /* flat object of state + derived + handlers */ };
}
```

#### Client Boundary File Naming

Client boundary files use `.client.tsx` suffix:
```
src/features/researcher/components/dashboard/tabs.shell.client.tsx
src/features/researcher/components/dashboard/papers-table.client.tsx
```

### Backend Feature Pattern

```
src/features/{domain}/
├── index.ts       # Re-exports
├── queries.ts     # Drizzle read queries
└── actions.ts     # Drizzle write mutations
```

#### Feature Import Rule

Always import from the **sub-file directly**, never from the feature root index:

```ts
// ✅ correct
import { listUserPapers } from '@/src/features/papers/queries';
// ❌ wrong — may pull server code into client bundle
import { listUserPapers } from '@/src/features/papers';
```

### Shared Layout

Each role group has its own layout using `RoleShell` from `src/shared/components/`. Dark theme background (`#1a1816`). Pages should NOT include their own navigation chrome.

### Styling Conventions

- **Tailwind CSS v4** — `@import "tailwindcss"` in `globals.css`, no `tailwind.config.js`
- Layout properties use Tailwind utilities. Semi-transparent colors use inline `style={{}}`.
- Dark palette: bg `#1a1816` / `rgba(45,42,38,...)`, text `#d4ccc0` / `#b0a898` / `#8a8070`, accents `#c9a44a` (gold) / `#8fbc8f` (green) / `#d4645a` (red) / `#5a7a9a` (blue)
- Font: `font-serif` (Georgia/serif stack)

### Web3 Integration

**Thirdweb v5** handles wallet connection. `context/UserContext.tsx` provides `useUser()`. `lib/auth.ts` issues JWTs in httpOnly cookies.

## Remaining Work (Priority Order)

### Tier 1 — Core Review Pipeline (hackathon differentiators)
1. **Journal dashboard: real data** — Replace mock data with DB-backed submission pipeline (Kanban: New → Criteria Published → Reviewers Assigned → Under Review → Decision Pending → Published/Rejected)
2. **Publish review criteria** — `POST /api/submissions/[id]/criteria` → hash + HCS anchor. Criteria become immutable. Editor UI: `CriteriaBuilder` component.
3. **Assign reviewers** — `POST /api/submissions/[id]/assign-reviewer` → create `review_assignments` row. Search reviewers by reputation score and field.
4. **Reviewer dashboard: real data** — Assigned reviews, deadlines, reputation score card, completed reviews.
5. **Review workspace: real data** — Display paper + criteria. Reviewer evaluates each criterion (yes/no/partially + comment). Submit → hash + HCS anchor.
6. **HTS soulbound reputation tokens** — Mint on review events. Create `AXIOM_REVIEWER_REPUTATION` token on HTS. Mint via API on review submission.
7. **Editorial decision flow** — If all required criteria met → system flags binding obligation. Reject requires on-chain justification. Decision → HCS anchor.

### Tier 2 — Rebuttal + Timeline
8. **Rebuttal phase** — When criteria not fully met and rejection likely, editor opens rebuttal. Researcher submits per-review responses (agree/disagree + justification). Editor resolves. Rebuttal + resolution → HCS anchor. Reputation tokens minted based on outcome.
9. **Timeline enforcement** — Track deadlines in `review_assignments`. Cron job checks overdue. Late = `review_late` HTS token. Researcher notifications at each stage.
10. **Researcher status updates** — Notifications table + polling. "Reviewers assigned", "Review 1/3 done", "Rebuttal phase open", etc.

### Tier 3 — Polish + Demo Features
11. **Wire Lit decrypt into explorer** — Researchers reading their own private papers.
12. **`/verify` page** — Upload PDF → client-side hash → check against DB/HCS.
13. **Reviewer search by reputation** — Editor searches reviewers filtered by score, field, timeliness.
14. **Review transparency** — After final decision, anonymized review comments visible on paper detail view.

### Tier 4 — Stretch
15. **Timeline enforcement smart contract** (Solidity on Hedera EVM)
16. **HTS minting via System Contracts** (hybrid HTS + EVM)
17. **Real ORCID OAuth flow**

## Key Architecture Decisions

### Pre-Registered Review Criteria

The cornerstone feature. Journals MUST publish criteria on-chain before review begins.

```typescript
interface ReviewCriterion {
    id: string;
    label: string;                    // "Methodology is reproducible"
    evaluationType: 'yes_no_partially' | 'scale_1_5';
    description?: string;
    required: boolean;                // Must be "yes" for criteria-met?
}
```

- Criteria are hashed (canonical JSON → SHA-256) and recorded on HCS `criteria` topic
- Once published, criteria are IMMUTABLE for that submission
- Reviewers evaluate each criterion with structured feedback
- System computes `allCriteriaMet` based on required criteria
- If met → journal bound to publish. Rejection requires public on-chain justification.

### Rebuttal Phase

Before final rejection, authors can challenge specific reviewer comments.

**Workflow:** Reviews complete → Editor triggers rebuttal (14 day deadline) → Author responds per-review (agree/disagree + justification) → Rebuttal hashed + HCS anchored → Editor resolves → Resolution HCS anchored → Reputation tokens minted based on outcome.

**Data model:**
- `rebuttals` table: links to submission, has status/deadline/resolution
- `rebuttal_responses` table: per-review responses with position + justification
- Resolution options: `upheld` (reviewer wrong) | `rejected` (reviewer right) | `partial`
- Rebuttal upheld → negative HTS token for reviewer. Rejected → positive token.

New paper status: `rebuttal_open` inserted between `under_review` and `revision_requested` / `published` / `rejected`.

### HTS Soulbound Reputation

Token: `AXIOM_REVIEWER_REPUTATION (AXR)` — Non-fungible, non-transferable.

Events that mint tokens:
- `review_completed` (on time) → positive
- `review_late` → negative
- `editor_rating` → variable
- `author_rating` (anonymous) → variable
- `paper_published` (reviewer's reviewed paper) → positive
- `paper_retracted` → negative
- `rebuttal_upheld` → negative for reviewer
- `rebuttal_overturned` → positive for reviewer

Score: `0.30 × Timeliness + 0.25 × Editor Rating + 0.25 × Author Feedback + 0.20 × Publication Outcome`

### Timeline Enforcement

| Event | Deadline |
|---|---|
| Editor assigns reviewers | 7 days from submission |
| Reviewer accepts/declines | 3 days from assignment |
| Review submission | 21 days from acceptance (configurable) |
| Editorial decision | 7 days from all reviews complete |
| Rebuttal response | 14 days from opening |
| Rebuttal resolution | 7 days from submission |

Overdue: reviewer gets `review_late` HTS token. Editor overdue: journal timeline score drops. Researcher notified at each transition.

### Lit Protocol — Review Phase Only

Lit encrypts paper content during the review phase. On publication, content is decrypted and handed to the journal's existing distribution system. **Axiom does NOT gate published paper access** — journals keep their paywall/subscription model.

| State | Who Decrypts | Condition |
|---|---|---|
| Private Draft | Researchers | `wallet IN researcherWallets` |
| Under Review | Researchers + reviewers + editor | `wallet IN allowedWallets` |
| Published | Journal's existing model | Decrypted, no longer Lit-gated |

### Review Comment Visibility

- During review: comments visible only to editor + reviewer (and researcher during rebuttal)
- After final decision (including rebuttal resolution): anonymized comments become PUBLIC
- Confidential editor comments are NEVER public, NEVER on-chain

## Directory Structure

All source code lives under `src/`. The `@/` path alias resolves to the project root.

```
src/
├── app/
│   ├── layout.tsx                 # Root (ThirdwebProvider, UserProvider, globals)
│   ├── page.tsx                   # Landing page
│   ├── globals.css                # Tailwind v4 import
│   ├── login/page.tsx
│   ├── onboarding/page.tsx
│   ├── api/
│   │   ├── auth/me/route.ts       # GET: authenticated user ✅
│   │   ├── activity/route.ts      # GET: activity feed ✅
│   │   ├── contracts/             # CRUD + signing ✅
│   │   ├── papers/                # CRUD + versions + submit ✅
│   │   └── upload/presigned/      # R2 presigned URLs ✅
│   │   # NEEDED:
│   │   # ├── submissions/[id]/criteria/route.ts      🔲
│   │   # ├── submissions/[id]/assign-reviewer/route.ts 🔲
│   │   # ├── submissions/[id]/decision/route.ts      🔲
│   │   # ├── reviews/route.ts + [id]/route.ts        🔲
│   │   # ├── reviews/[id]/rate/route.ts              🔲
│   │   # ├── rebuttals/[submissionId]/route.ts       🔲
│   │   # ├── rebuttals/[submissionId]/resolve/route.ts 🔲
│   │   # ├── journals/[id]/reviewers/route.ts        🔲
│   │   # ├── reputation/[wallet]/route.ts            🔲
│   │   # └── cron/reputation/ + cron/deadlines/      🔲
│   ├── researcher/                # ✅ Real data
│   ├── editor/                    # 🔲 Mock data (UI redesigned, PDF viewer wired)
│   └── reviewer/                  # 🔲 Mock data
├── features/
│   ├── researcher/                # Components, hooks, mappers, types ✅
│   ├── contracts/                 # DB queries + actions ✅
│   ├── papers/                    # DB queries + actions ✅
│   ├── users/                     # DB queries ✅
│   ├── editor/                    # Mock components, redesigned UI 🔲
│   └── reviewer/                  # Mock components 🔲
│   # NEEDED:
│   # ├── submissions/             # DB domain: queries + actions 🔲
│   # ├── reviews/                 # DB domain: queries + actions 🔲
│   # ├── rebuttals/               # DB domain: queries + actions 🔲
│   # └── reputation/              # DB domain: queries + actions 🔲
└── shared/
    ├── components/                # TopBar, Footer, RoleShell, PdfViewer, etc. ✅
    ├── context/UserContext.tsx     # Wallet + session ✅
    ├── hooks/useAuthFetch.ts      # Mutation-triggered refreshes ✅
    ├── lib/
    │   ├── auth/                  # JWT ✅
    │   ├── db/schema.ts           # Drizzle schema ✅ (needs new tables)
    │   ├── hedera/client.ts + hcs.ts  # HCS ✅
    │   ├── lit/                   # Encrypt ✅, decrypt (not wired) 🔲
    │   ├── hashing.ts             # SHA-256 ✅
    │   └── storage.ts             # R2 ✅
    │   # NEEDED:
    │   # └── hedera/hts.ts        # HTS token operations 🔲
    └── types/                     # Shared types ✅
```

## Coding Conventions

- **TypeScript strict mode** throughout.
- **Server Components** by default. `'use client'` only for browser APIs / interactivity.
- **Imports:** `@/` path alias. Import from sub-files, not feature barrels (see Feature Import Rule).
- **File naming:** Components: PascalCase. Client boundaries: `.client.tsx`. Hooks: camelCase. Types/mock: kebab-case.
- **Dynamic routes:** `[id]` not `[paperId]`.
- **No localStorage/sessionStorage.** React context + httpOnly cookies.
- **API routes using Hedera SDK:** `export const runtime = 'nodejs'`.
- **Graceful degradation:** Hedera, Lit, R2 all fall back if env vars missing.
- **Auth:** `getSession()` from `@/src/shared/lib/auth/auth`. Never trust wallet from request body.
- **Validation:** `createInsertSchema(table)` from `drizzle-zod`. Don't duplicate DB schema.
- **Canonical JSON:** Always `canonicalJson()` from `lib/hashing.ts` for anything hashed. Never raw `JSON.stringify()`.

## Database

Drizzle ORM. Dev: SQLite. Prod: Neon PostgreSQL. Schema in `src/shared/lib/db/schema.ts`.

**Existing tables:** `users`, `papers`, `paperVersions`, `authorshipContracts`, `contractContributors`, `journals`, `submissions`, `notifications`, `activityLog`

**Tables to add:**
- `reviewCriteria` — per-submission criteria (JSONB + hash + HCS tx)
- `reviewAssignments` — reviewer ↔ submission link with deadline tracking
- `reviews` — structured criteria evaluations + recommendation + HCS tx
- `rebuttals` — per-submission rebuttal with status/deadline/resolution
- `rebuttalResponses` — per-review responses (agree/disagree + justification)
- `reviewerRatings` — anonymous author ratings (NO author reference column)
- `reputationEvents` — append-only log with HTS token serial
- `reputationScores` — materialized aggregate scores

**Key conventions:**
- `reputationEvents` is append-only — never update or delete.
- `reviewerRatings` has NO author reference (anonymity by design). Never add one.
- Paper status now includes `rebuttal_open` between `under_review` and decision states.
- `studyType` on papers: `original`, `negative_result`, `replication`, `replication_failed`, `meta_analysis`.

## Environment Variables

```
# Auth (required)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID
AUTH_PRIVATE_KEY
NEXT_PUBLIC_APP_DOMAIN

# Database (required)
DATABASE_URL

# Hedera (optional — graceful fallback)
HEDERA_NETWORK, HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY
HCS_TOPIC_PAPERS, HCS_TOPIC_CONTRACTS, HCS_TOPIC_SUBMISSIONS

# Planned HCS topics
HCS_TOPIC_CRITERIA, HCS_TOPIC_REVIEWS, HCS_TOPIC_DECISIONS, HCS_TOPIC_RETRACTIONS

# HTS (planned)
HTS_REPUTATION_TOKEN_ID

# Cloudflare R2 (optional — graceful fallback)
S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT

# Lit Protocol (optional — graceful fallback)
NEXT_PUBLIC_LIT_NETWORK
```

## Things to Watch Out For

### Hashing & Serialization
- **Canonical JSON:** Always `canonicalJson()` for anything hashed. Different serialization = different hashes = broken verification.
- **On-chain hash = ORIGINAL file:** Lit-encrypted blobs have different hashes. On-chain hash is always of the unencrypted content.

### Hedera
- **Node.js runtime only.** `export const runtime = 'nodejs'` on all Hedera-using routes.
- **HCS message limit:** ~6KB. Hashes + metadata only.
- **HTS soulbound:** No native soulbound flag. Enforce via custom fee schedule or admin-only transfer. Test early.
- **System Contracts (stretch):** HTS precompiles at specific addresses documented in Hedera docs.

### Review Pipeline
- **Criteria immutability:** Once published on HCS, criteria CANNOT change for that submission.
- **Criteria-met computation:** Server computes `allCriteriaMet` from individual evaluations. If all `required` criteria = 'yes', criteria are met.
- **Rebuttal timing:** Rebuttal phase opens AFTER reviews complete but BEFORE final decision. New status: `rebuttal_open`.
- **Review comment visibility:** Comments NOT public during review. Public only after final decision (including rebuttal resolution).
- **Confidential editor comments:** NEVER on-chain. NEVER public. Stored off-chain only.

### Privacy & Anonymity
- **Reviewer identity:** Reviews linked to wallet, not real name. Anonymous to researchers.
- **Researcher ratings:** `reviewerRatings` has NO researcher reference. One-way hash for dedup only. Never add rater identity.
- **Rebuttal ≠ reviewer identity exposure:** Researchers see review content during rebuttal but NOT reviewer identity.

### Lit Protocol
- **Lit + Hedera compatibility:** Highest technical risk. Test EVM-compatible conditions via Hedera JSON-RPC early.
- **Review phase only:** Lit gates content during draft + review. NOT for published paper access (journals keep their paywall).
- **Condition updates:** When reviewers assigned, update Lit conditions to include their wallets.
- **On publication:** Decrypt content and re-upload as plaintext (or hand off to journal).

### Contracts & Signatures
- **Modification cascade:** Changing ANY contract field after ANY signature invalidates ALL signatures.
- **Invite tokens:** 7-day expiry. Claimed by connecting wallet on `/invite/[token]`.

### Timeline
- **Deadline computation:** `review_assignments.deadline` = `assigned_at + review_deadline_days` from submission config.
- **Overdue check:** Cron job at `/api/cron/deadlines`. Overdue + not submitted = mint `review_late` HTS token.