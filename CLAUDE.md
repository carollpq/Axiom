# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

Axiom is a blockchain-backed academic publishing and peer review platform built on Hedera. It focuses on making the **review process** fair, transparent, and accountable — without disrupting journal revenue models. Journals publish review criteria on-chain, reviewers build portable soulbound reputation, authors get real-time updates and the right to rebut unfair reviews, and all commitments are cryptographically enforced.

**Hackathon:** Hedera Hello Future: Apex 2026

### Project Status

The codebase is a **functional full-stack application** with complete end-to-end integration across all roles (researcher, editor, reviewer). All three role dashboards are DB-backed with real data, all API routes are implemented and working, and all major features are wired together.

**What's working end-to-end:**
- ✅ **User authentication** — Multi-step login: role selector → wallet connect → ORCID verification → DB save → role-based dashboard routing
- ✅ **Paper registration** — Client-side SHA-256 hashing → IPFS upload (web3.storage) → Lit encryption → DB storage → Hedera HCS anchoring
- ✅ **Authorship contracts** — Creation + wallet signing (verified via viem `verifyMessage`) → HCS anchoring per signature. Fully-signed contracts use Hedera Scheduled Transactions (wrapping HCS message). Modification → signature invalidation.
- ✅ **Paper submission** — `POST /api/papers/[id]/submit` → `submissions` row → HCS anchor → status `submitted`
- ✅ **Editor dashboard** — DB-backed submission pipeline (incoming → criteria published → reviewers assigned → under review → rebuttal → decision). Five pages: dashboard (stats + carousel), incoming papers, under review, accepted papers, journal management. All use three-column layout (paper list → PDF viewer → contextual sidebar panels). Sidebar panels: criteria builder, reviewer assignment, review status, review comments, final decision, desk reject, rebuttal resolution, add-to-issue.
- ✅ **Journal management** — Editor can update journal aims/scope and submission criteria, create/delete issues, assign papers to issues, and manage a reviewer pool (add/remove reviewers)
- ✅ **Review criteria publishing** — `POST /api/submissions/[id]/criteria` → canonical JSON hash → HCS anchor → immutable criteria
- ✅ **Reviewer assignment** — `POST /api/submissions/[id]/assign-reviewer` → `reviewAssignments` row with deadline tracking + on-chain deadline registration via TimelineEnforcer smart contract
- ✅ **Lit Protocol reviewer gating** — Reviewer wallets automatically added to Lit access conditions on assignment. `addReviewersToAccessConditions()` parses existing conditions, merges reviewer wallets, and updates `papers.litAccessConditionsJson`. Reviewers can now decrypt papers during review phase.
- ✅ **Lit Protocol decryption UI** — `useDecryptPaper` hook fetches encrypted content from API, decrypts via Lit, and returns blob URL. Wired into editor components (under-review, incoming-papers, accepted-papers) and reviewer components (papers-under-review). Auto-decrypts when paper has Lit data. Falls back to raw PDF for non-encrypted papers.
- ✅ **Review submission** — `POST /api/reviews/[id]` → per-criterion evaluations → hash → HCS anchor → reputation token minting → TimelineEnforcer `markCompleted` → reputation score recomputation
- ✅ **Editorial decision** — `POST /api/submissions/[id]/decision` → `allCriteriaMet` computation → HCS anchor → reputation events
- ✅ **Rebuttal phase** — Researcher-initiated → researcher responds per-review → editor resolves → HCS anchored → reputation tokens minted
- ✅ **Timeline enforcement** — Cron job at `/api/cron/deadlines` marks overdue assignments → `review_late` reputation tokens. Smart contract cross-verification via `TimelineEnforcer.sol` on Hedera EVM (chain as source of truth).
- ✅ **Notifications** — DB-backed with NotificationBell component, 30s polling, integrated across all pipeline stages
- ✅ **Review transparency** — Anonymized reviews visible after final decision (confidentialEditorComments always excluded)
- ✅ **Anonymous 5-protocol reviewer ratings** — `POST /api/reviews/[id]/rate` with 5-dimensional rating (actionable feedback, deep engagement, fair/objective, justified recommendation, appropriate expertise) + optional anonymous comment. NO author reference stored.
- ✅ **PDF viewer** — react-pdf v10 / pdfjs-dist v5 in editor three-column views
- ✅ **Researcher dashboard** — Real DB data + public explorer + pending actions (including rebuttal links)
- ✅ **Co-author paper visibility** — `listUserPapers` returns both owned papers and papers where wallet is a contributor on any authorship contract
- ✅ **Viewed by Editor status** — `POST /api/submissions/[id]/view` → transitions `submitted` → `viewed_by_editor` → HCS anchor → researcher notification
- ✅ **Reviewer assignment acceptance** — `POST /api/submissions/[id]/accept-assignment` → reviewer accepts/declines → auto-transitions to `under_review` when 2+ accepted
- ✅ **Author review response** — `POST /api/submissions/[id]/author-response` → researcher accepts reviews or requests rebuttal → HCS anchored
- ✅ **Review-response page** — Researcher views anonymized reviews, rates each (5-protocol), and accepts or requests rebuttal in a single flow
- ✅ **Backend contract validation** — `POST /api/papers/[id]/submit` validates authorship contract is fully signed before submission
- ✅ **TimelineEnforcer smart contract** — `contracts/contracts/TimelineEnforcer.sol` deployed to Hedera EVM. Deadlines registered on-chain at reviewer assignment, marked completed on review submission, cross-verified in cron job. Integrated via ethers v6 wrapper at `src/shared/lib/hedera/timeline-enforcer.ts`.
- ✅ **Mirror Node reads** — `src/shared/lib/hedera/mirror.ts` queries Hedera Mirror Node for NFT data, account lookups, and on-chain reputation verification. `GET /api/reviews/reputation?wallet=0x...` returns DB score + recent events + on-chain NFT data.
- ✅ **Reputation score computation** — `upsertReputationScore()` computes weighted score (0.30 timeliness + 0.25 editor + 0.25 author + 0.20 publication) via SQL aggregation. Auto-recomputed after every reputation event. Stored in `reputationScores` table.
- ✅ **Scheduled Transactions** — Fully-signed authorship contracts use `ScheduleCreateTransaction` wrapping HCS message. Operator signs immediately to trigger execution. Schedule ID stored for verification.
- ✅ **Reviewer dashboard** — Dashboard + assigned papers + completed papers + incoming invites + pool invites all wired to real DB data. Components: `listAssignedReviews`, `listCompletedReviewsExtended`, `listPendingInvites`, `listPendingPoolInvites`.
- ✅ **Reviewer acceptance/decline** — `POST /api/submissions/[id]/accept-assignment` with review assignment state transitions + HCS anchoring + notifications.
- ✅ **Reviewer search by reputation score** — Editor can filter reviewers by composite reputation score (0–5 scale) when assigning reviews. Slider-based filtering in both inline assignment panel and add-to-pool modal. Reputation scores automatically synced from DB.

**What is not yet implemented:**
- (all major features complete!)

**Current stack:** Next.js 16 (App Router, Turbopack) · React 19.2 · Tailwind CSS v4 · Thirdweb v5 · TypeScript strict mode · Neon PostgreSQL/Drizzle ORM · Hedera SDK (HCS + HTS + Smart Contracts + Mirror Node + Scheduled Transactions) · ethers v6 (EVM contract interaction) · Lit Protocol SDK (encrypt + decrypt, dynamically imported) · web3.storage (IPFS + Filecoin) · react-pdf v10 (pdfjs-dist v5)

## Common Commands

```bash
npm run dev                    # Start dev server with Turbopack (http://localhost:3000)
npm run build                  # Production build (requires NEXT_PUBLIC_THIRDWEB_CLIENT_ID)
npx tsc --noEmit               # Type-check without building (use for quick validation)
npm run lint                   # ESLint
npm run format                 # Prettier formatting
```

### Smart Contracts (Hardhat)

The `contracts/` directory has its own `package.json` to isolate Hardhat dependencies from the Next.js app.

```bash
npm run contracts:install      # Install Hardhat dependencies (cd contracts && npm install)
npm run contracts:compile      # Compile Solidity contracts
npm run contracts:test         # Run Hardhat tests (local network)
npm run contracts:deploy:testnet  # Deploy TimelineEnforcer to Hedera testnet
```

**Contract:** `TimelineEnforcer.sol` — On-chain deadline tracking for review assignments. Pure Solidity (no Hedera precompile dependency). HTS reputation minting remains SDK-only via `src/shared/lib/hedera/hts.ts`.

**Env vars** (add to `.env.local`):
- `HEDERA_EVM_PRIVATE_KEY` — ECDSA key for EVM transactions (if operator key is ED25519)
- `TIMELINE_ENFORCER_ADDRESS` — Deployed TimelineEnforcer address

## Architecture

### Core Focus: Peer Review Quality & Accountability

The platform's value proposition centers on improving the *quality* of peer review and making reviewer behavior accountable — the most underdeveloped part of the current academic publishing ecosystem. Reviewers today give feedback with no accountability, no recognition, and no incentive to improve. Axiom fixes this.

The key differentiators:

1. **Structured reviewer feedback** — Reviews are broken into per-criterion evaluations (yes/no/partially + required comment). Reviewers can no longer just write vague rejections — every concern must be tied to a stated criterion.
2. **Soulbound reviewer reputation** — HTS NFTs minted per review event. Portable, non-transferable, cross-journal. Reviewers build a verifiable quality record that follows them everywhere.
3. **Pre-registered review criteria** — Journals publish review criteria on HCS before review begins. Criteria become immutable. If a paper is rejected despite meeting stated criteria, the editor must provide **public on-chain justification** — creating accountability without overriding editorial discretion.
4. **Rebuttal phase** — Authors can challenge specific reviewer comments they believe are unfair or factually wrong. If a rebuttal is upheld, the reviewer gets a negative reputation event. This incentivizes reviewers to make well-supported critiques.
5. **Enforced timelines** — Deadlines tracked with on-chain anchoring. Late reviews = negative reputation tokens.
6. **Transparent post-decision reviews** — After final decision, anonymized review comments become public. Reviewers know their work will be visible — incentivizing quality over laziness.

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
src/features/{domain}/lib/{domain}.ts                # Pure mapping / utility functions
```

**The split:** server fetches, client interacts.

**What stays client-side forever:** wallet signing (`account.signMessage`), file hashing (Web Crypto API), Lit encryption, IPFS uploads, `useUser()` / `useActiveAccount()`.

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
├── queries.ts     # Drizzle read queries
├── actions.ts     # Drizzle write mutations
├── mutations.ts   # Drizzle write helpers (called by actions or API routes)
├── types.ts       # All types for this feature domain
├── lib.ts         # Pure mapping / utility functions (or lib/ directory for larger modules)
├── hooks/         # Thin hooks (useReducer + side effects only)
├── reducers/      # Pure state machines (testable without React)
└── config/        # Step definitions, constants
```

**No barrel `index.ts` files.** Feature modules must not have barrel re-exports (see Feature Import Rule).

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

### Performance Patterns

- **Provider code splitting** — `ThirdwebProvider` + `UserProvider` extracted into `providers.client.tsx` client boundary. Root layout imports it as a client component, enabling automatic code splitting of the ~200KB Thirdweb bundle.
- **Lit SDK dynamic imports** — `@lit-protocol/auth-helpers` and `@lit-protocol/constants` are dynamically imported inside function bodies in `decrypt.ts`, deferring ~500KB from the initial bundle. `useDecryptPaper.ts` dynamically imports `decryptFileWithLit`.
- **Suspense streaming** — All 5 editor pages wrap async data-fetching content in `<Suspense>` with skeleton fallbacks, enabling progressive rendering.
- **`after()` for non-blocking side effects** — API routes (`cron/deadlines`, `reviews/[id]`, `submissions/[id]/decision`, `submissions/[id]/author-response`, `rebuttals/[rebuttalId]/resolve`) use `after()` from `next/server` to defer HCS anchoring, reputation minting, and notification creation after the response is sent.
- **SQL-level filtering** — `listReviewerPool` uses PostgreSQL JSONB `@>` operator instead of fetching all users and filtering in JS.
- **Hoisted style constants** — Shared inline style objects extracted to module scope in `CreateSubmission`, `NotificationBell`, and `under-review` to prevent re-creation on every render.
- **Stable callbacks** — `useRebuttal.submitRebuttal` uses a ref to read `state.responses` inside `useCallback`, avoiding dependency on the changing object reference.
- **Lazy useState** — `ReviewResponseClient` uses lazy initializer functions for `useState` to avoid re-computing initial values.

### Web3 Integration

**Thirdweb v5** handles wallet connection. `context/UserContext.tsx` provides `useUser()`. `lib/auth.ts` issues JWTs in httpOnly cookies.

## Remaining Work (Priority Order)

### Completed
- ✅ Journal dashboard: real data (DB-backed submission pipeline)
- ✅ User authentication flow (wallet + ORCID + role selection)
- ✅ Publish review criteria (hash + HCS anchor, immutable)
- ✅ Assign reviewers (with deadline tracking)
- ✅ Review submission (per-criterion evaluations + hash + HCS anchor)
- ✅ HTS soulbound reputation tokens (mint on review events)
- ✅ Editorial decision flow (`allCriteriaMet` computation + HCS anchor)
- ✅ Rebuttal phase (open → respond → resolve, with HCS anchoring + reputation tokens)
- ✅ Timeline enforcement (cron job checks overdue, mints `review_late` tokens)
- ✅ Notifications (DB-backed, polling, integrated across all pipeline stages)
- ✅ Review transparency (anonymized reviews public after decision)
- ✅ Anonymous reviewer ratings (no author reference stored)
- ✅ Lit Protocol reviewer gating (reviewer wallets added to access conditions on assignment)
- ✅ Lit Protocol decryption UI (wired into editor + reviewer components, auto-decrypt on load)
- ✅ Reviewer dashboard: wired to real data (dashboard, assigned papers, completed papers, invites, pool invites)

### Still To Do
1. (none — all major features implemented!)

### Stretch
2. **HTS minting via System Contracts** (hybrid HTS + EVM)
3. **Real ORCID OAuth flow**

## Key Architecture Decisions

### Pre-Registered Review Criteria

Journals publish review criteria on HCS before review begins. This is NOT a contractual obligation to publish — journals keep full editorial discretion. The value is **accountability**: criteria are immutable on-chain, and any rejection must be justifiable against the stated criteria or the editor provides a public explanation. This creates social/reputational pressure without needing legal enforceability.

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
- Reviewers evaluate each criterion with structured feedback (vague rejections are no longer possible)
- System computes `allCriteriaMet` based on required criteria
- If all criteria met but editor still rejects → editor must provide public on-chain justification visible to all
- This creates **public accountability**, not a legal contract to publish

### Rebuttal Phase

Before final rejection, authors can challenge specific reviewer comments.

**Workflow:** Reviews complete → Researcher views reviews and rates each (5-protocol) → Researcher chooses "Accept Reviews" or "Request Rebuttal" → If rebuttal: 14-day deadline → Author responds per-review (agree/disagree + justification) → Rebuttal hashed + HCS anchored → Editor resolves → Resolution HCS anchored → Reputation tokens minted based on outcome.

**Key change:** Rebuttal is now researcher-initiated (not editor-initiated). The `POST /api/submissions/[id]/open-rebuttal` route returns 410 Gone. Rebuttals are triggered via `POST /api/submissions/[id]/author-response` with `action: "request_rebuttal"`.

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

Overdue: reviewer gets `review_late` HTS token. Editor overdue: journal timeline score drops. Researcher notified at each transition. Cron job cross-verifies with TimelineEnforcer smart contract (chain as source of truth — if contract says not overdue, skip penalty).

### Lit Protocol — Review Phase Only

Lit encrypts paper content during the review phase. On publication, content is decrypted and handed to the journal's existing distribution system. **Axiom does NOT gate published paper access** — journals keep their paywall/subscription model.

**Access control by phase:**

| Phase | Who Decrypts | Condition | How Access is Granted |
|---|---|---|---|
| Private Draft | Researchers | `wallet IN researcherWallets` | Author's wallet added at paper creation |
| Under Review | Researchers + reviewers + editor | `wallet IN allowedWallets` | Reviewer wallets added dynamically when assigned; editor wallet added if in scope |
| Published | Journal's existing model | Decrypted, no longer Lit-gated | Paper is decrypted and redeployed as plaintext |

**Reviewer access flow:**

1. **Paper created** → Encrypted with author wallet only: `buildWalletListConditions([authorWallet])`
2. **Reviewers assigned** → `assignReviewersAction()` calls `addReviewersToAccessConditions(existingJson, reviewerWallets)`
   - Extracts existing wallets from access conditions JSON
   - Merges new reviewer wallets (deduplicates case-insensitive)
   - Rebuilds access conditions with all wallets
   - Updates `papers.litAccessConditionsJson` in DB
3. **Reviewer connects wallet** → Uses `decryptFileWithLit()` with updated conditions
   - Lit verifies reviewer wallet signature matches an allowed wallet
   - Decryption succeeds

**Key utilities** (`src/shared/lib/lit/access-control.ts`):
- `buildWalletListConditions(wallets: string[])` — Creates OR-conditions for wallet list
- `extractWalletsFromConditions(conditions)` — Parses wallet addresses from existing conditions
- `addReviewersToAccessConditions(existingJson, reviewerWallets)` — Merges wallets and rebuilds JSON

**Implementation notes:**
- Conditions are stored as JSON strings in `papers.litAccessConditionsJson`
- Invalid/unparseable conditions are logged as warnings; system rebuilds from scratch
- No wallets are duplicated (case-insensitive deduplication)
- Access condition updates happen synchronously during assignment (not deferred via `after()`)
- This enables reviewers to decrypt papers immediately after assignment without waiting for notification delivery

### Review Comment Visibility

- During review: comments visible only to editor + reviewer (and researcher during rebuttal)
- After final decision (including rebuttal resolution): anonymized comments become PUBLIC
- Confidential editor comments are NEVER public, NEVER on-chain

## Directory Structure

All source code lives under `src/`. The `@/` path alias resolves to the project root.

```
src/
├── app/
│   ├── layout.tsx                 # Root (imports Providers from providers.client.tsx)
│   ├── providers.client.tsx       # Client boundary: ThirdwebProvider + UserProvider (code-split)
│   ├── page.tsx                   # Landing page
│   ├── globals.css                # Tailwind v4 import
│   ├── login/page.tsx
│   ├── onboarding/page.tsx
│   ├── invite/[token]/page.tsx    # Invite claim page
│   ├── api/
│   │   ├── contracts/             # CRUD + signing + invite + reset-signatures
│   │   ├── papers/[id]/content/   # GET: binary PDF bytes
│   │   ├── submissions/[id]/      # criteria/ + assign-reviewer/ + decision/ + view/ + accept-assignment/ + author-response/ + open-rebuttal/ (deprecated)
│   │   ├── reviews/[id]/          # GET/POST review + rate/
│   │   ├── reviews/reputation/    # GET: public reputation verification (DB + Mirror Node)
│   │   ├── rebuttals/[rebuttalId]/ # respond/ + resolve/
│   │   ├── cron/deadlines/route.ts # GET: deadline enforcement cron
│   │   └── upload/ipfs/            # IPFS upload via web3.storage
│   ├── (protected)/
│   │   ├── researcher/            # Dashboard, authorship-contracts, create-submission, view-submissions, paper-version-control (includes paper registration), rebuttal/[submissionId], review-response/[submissionId]
│   │   ├── editor/                # Dashboard, incoming, under-review, accepted, management
│   │   └── reviewer/              # Dashboard, assigned (inline review sidebar)
├── features/
│   ├── auth/                      # Login flow components
│   ├── researcher/                # Components, hooks, reducers, config, constants, lib, queries, types, nav
│   ├── editor/                    # Components, hooks, queries, actions, lib, types (fully DB-backed, three-column layouts, sidebar panels)
│   ├── reviewer/                  # Components, hooks, query, actions, lib (fully DB-backed, dashboard + three-column layouts)
│   ├── contracts/                 # DB queries + actions
│   ├── papers/                    # DB queries + actions
│   ├── users/                     # DB queries + actions + lib
│   ├── reviews/                   # DB queries + actions + lib
│   ├── rebuttals/                 # DB queries + actions + hooks + components
│   ├── notifications/             # DB queries + actions + NotificationBell component
└── shared/
    ├── components/                # TopBar, Footer, RoleShell, DashboardHeader, PdfViewer, etc.
    ├── context/UserContext.tsx     # Wallet + session
    ├── hooks/useCurrentUser.ts    # Current user context
    ├── lib/
    │   ├── auth/                  # JWT
    │   ├── db/schema.ts           # Drizzle schema (16 tables)
    │   ├── hedera/client.ts + hcs.ts + hts.ts + mirror.ts + schedule.ts + timeline-enforcer.ts  # HCS + HTS + Mirror Node + Scheduled Txs + Smart Contract
    │   ├── lit/                   # Encrypt (decrypt not wired)
    │   ├── hashing.ts             # SHA-256 + canonical JSON
    │   └── storage.ts             # IPFS (web3.storage)
    └── types/                     # Shared types
```

## Coding Conventions

- **TypeScript strict mode** throughout.
- **Server Components** by default. `'use client'` only for browser APIs / interactivity.
- **Imports:** `@/` path alias. Import from sub-files, not feature barrels (see Feature Import Rule).
- **User lookups:** Always use `getUserByWallet()` from `@/src/features/users/queries` (React `cache()`-wrapped). Never inline `db.select().from(users).where(...)`.
- **File naming:** Components: PascalCase. Client boundaries: `.client.tsx`. Hooks: camelCase. Types/mock: kebab-case.
- **Dynamic routes:** `[id]` not `[paperId]`.
- **No localStorage/sessionStorage.** React context + httpOnly cookies.
- **API routes using Hedera SDK:** `export const runtime = 'nodejs'`.
- **Graceful degradation:** Hedera, Lit, IPFS all fall back if env vars missing.
- **Auth:** `getSession()` from `@/src/shared/lib/auth/auth`. Never trust wallet from request body.
- **Validation:** `createInsertSchema(table)` from `drizzle-zod`. Don't duplicate DB schema.
- **Canonical JSON:** Always `canonicalJson()` from `lib/hashing.ts` for anything hashed. Never raw `JSON.stringify()`.
- **Non-blocking side effects:** Use `after()` from `next/server` in API routes for HCS anchoring, reputation minting, and notifications. Return the response immediately after critical DB writes.

## Database

Drizzle ORM. Neon PostgreSQL (dev and prod). Schema in `src/shared/lib/db/schema.ts`.

**All 16 tables:**
- `users` — wallet, ORCID, role, research fields
- `papers` — title, status, study type, visibility
- `paperVersions` — versions with hashes + Hedera anchoring
- `authorshipContracts` — authorship contracts with status tracking + Hedera schedule ID/tx
- `contractContributors` — contributors per contract with signatures + invite tokens + schedule sign tx
- `journals` — journal metadata (name, editor wallet, reputation)
- `submissions` — paper → journal submissions with status pipeline
- `reviewCriteria` — per-submission criteria (JSONB + hash + HCS tx, immutable)
- `reviewAssignments` — reviewer ↔ submission link with deadline tracking + TimelineEnforcer on-chain index
- `reviews` — structured criteria evaluations + recommendation + HCS tx
- `rebuttals` — per-submission rebuttal with status/deadline/resolution
- `rebuttalResponses` — per-review responses (agree/disagree + justification)
- `reviewerRatings` — anonymous author ratings (NO author reference column)
- `reputationEvents` — append-only log with HTS token serial
- `reputationScores` — materialized aggregate scores
- `notifications` — user notifications (type, title, body, link, read status)

**Key status types:**
- `SubmissionStatusDb`: submitted → viewed_by_editor → criteria_published → reviewers_assigned → under_review → reviews_completed → rebuttal_open → revision_requested/accepted/rejected/published
- `AuthorResponseStatusDb`: pending | accepted | rebuttal_requested
- `ReviewAssignmentStatusDb`: assigned → accepted/declined → submitted/late
- `RebuttalStatusDb`: open → submitted → under_review → resolved
- `RebuttalResolutionDb`: upheld | rejected | partial

**Key conventions:**
- `reputationEvents` is append-only — never update or delete.
- `reviewerRatings` has 5-protocol columns (actionableFeedback, deepEngagement, fairObjective, justifiedRecommendation, appropriateExpertise) + overallRating + optional comment/commentHash. NO author reference (anonymity by design). Never add one.
- `submissions` has `authorResponseStatus` / `authorResponseAt` / `authorResponseTxId` for researcher's response to completed reviews.
- Paper status includes `viewed_by_editor` after `submitted`, `reviews_completed` after `under_review`, and `rebuttal_open` before decision states.
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
HEDERA_EVM_PRIVATE_KEY                    # ECDSA key for EVM transactions (TimelineEnforcer)
HCS_TOPIC_PAPERS, HCS_TOPIC_CONTRACTS, HCS_TOPIC_SUBMISSIONS
HCS_TOPIC_CRITERIA, HCS_TOPIC_REVIEWS, HCS_TOPIC_DECISIONS, HCS_TOPIC_RETRACTIONS
HTS_REPUTATION_TOKEN_ID
TIMELINE_ENFORCER_ADDRESS                 # Deployed TimelineEnforcer contract address

# Cron (optional — for deadline enforcement)
CRON_SECRET

# IPFS / web3.storage (optional — graceful fallback)
W3_PRINCIPAL_KEY, W3_DELEGATION_PROOF

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
- **TimelineEnforcer contract:** Uses ethers v6 via Hashio JSON-RPC (`testnet.hashio.io/api`). Contract instance is cached at module scope. Requires `TIMELINE_ENFORCER_ADDRESS` + `HEDERA_EVM_PRIVATE_KEY`.
- **Mirror Node:** Public read-only API, no auth needed. Defaults to testnet like other Hedera modules. Limited to 100 NFTs per query (sufficient for demo).
- **Scheduled Transactions:** Used for fully-signed authorship contracts. Operator creates schedule wrapping HCS message, then signs immediately to trigger execution. Falls back to direct HCS anchor if schedule fails.
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
- **Reviewer access conditions:** When reviewers assigned, `addReviewersToAccessConditions()` parses existing conditions, merges reviewer wallets (dedup case-insensitive), rebuilds conditions, and updates DB. Reviewers can decrypt immediately.
- **Condition parsing:** If existing JSON is invalid, system logs a warning and rebuilds from scratch with all known wallets.
- **On publication:** Decrypt content and re-upload as plaintext (or hand off to journal).

### Contracts & Signatures
- **Modification cascade:** Changing ANY contract field after ANY signature invalidates ALL signatures.
- **Invite tokens:** 7-day expiry. Claimed by connecting wallet on `/invite/[token]`.

### Timeline
- **Deadline computation:** `review_assignments.deadline` = `assigned_at + review_deadline_days` from submission config.
- **Overdue check:** Cron job at `/api/cron/deadlines`. Overdue + not submitted = mint `review_late` HTS token.

<!-- NEXT-AGENTS-MD-START -->[Next.js Docs Index]|root: ./.next-docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: npx @next/codemod agents-md --output CLAUDE.md|01-app:{04-glossary.mdx}|01-app/01-getting-started:{01-installation.mdx,02-project-structure.mdx,03-layouts-and-pages.mdx,04-linking-and-navigating.mdx,05-server-and-client-components.mdx,06-cache-components.mdx,07-fetching-data.mdx,08-updating-data.mdx,09-caching-and-revalidating.mdx,10-error-handling.mdx,11-css.mdx,12-images.mdx,13-fonts.mdx,14-metadata-and-og-images.mdx,15-route-handlers.mdx,16-proxy.mdx,17-deploying.mdx,18-upgrading.mdx}|01-app/02-guides:{analytics.mdx,authentication.mdx,backend-for-frontend.mdx,caching.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,data-security.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,json-ld.mdx,lazy-loading.mdx,local-development.mdx,mcp.mdx,mdx.mdx,memory-usage.mdx,multi-tenant.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,prefetching.mdx,production-checklist.mdx,progressive-web-apps.mdx,public-static-pages.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,single-page-applications.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx,videos.mdx}|01-app/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|01-app/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|01-app/02-guides/upgrading:{codemods.mdx,version-14.mdx,version-15.mdx,version-16.mdx}|01-app/03-api-reference:{07-edge.mdx,08-turbopack.mdx}|01-app/03-api-reference/01-directives:{use-cache-private.mdx,use-cache-remote.mdx,use-cache.mdx,use-client.mdx,use-server.mdx}|01-app/03-api-reference/02-components:{font.mdx,form.mdx,image.mdx,link.mdx,script.mdx}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.mdx,manifest.mdx,opengraph-image.mdx,robots.mdx,sitemap.mdx}|01-app/03-api-reference/03-file-conventions:{default.mdx,dynamic-routes.mdx,error.mdx,forbidden.mdx,instrumentation-client.mdx,instrumentation.mdx,intercepting-routes.mdx,layout.mdx,loading.mdx,mdx-components.mdx,not-found.mdx,page.mdx,parallel-routes.mdx,proxy.mdx,public-folder.mdx,route-groups.mdx,route-segment-config.mdx,route.mdx,src-folder.mdx,template.mdx,unauthorized.mdx}|01-app/03-api-reference/04-functions:{after.mdx,cacheLife.mdx,cacheTag.mdx,connection.mdx,cookies.mdx,draft-mode.mdx,fetch.mdx,forbidden.mdx,generate-image-metadata.mdx,generate-metadata.mdx,generate-sitemaps.mdx,generate-static-params.mdx,generate-viewport.mdx,headers.mdx,image-response.mdx,next-request.mdx,next-response.mdx,not-found.mdx,permanentRedirect.mdx,redirect.mdx,refresh.mdx,revalidatePath.mdx,revalidateTag.mdx,unauthorized.mdx,unstable_cache.mdx,unstable_noStore.mdx,unstable_rethrow.mdx,updateTag.mdx,use-link-status.mdx,use-params.mdx,use-pathname.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,use-selected-layout-segment.mdx,use-selected-layout-segments.mdx,userAgent.mdx}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,appDir.mdx,assetPrefix.mdx,authInterrupts.mdx,basePath.mdx,browserDebugInfoInTerminal.mdx,cacheComponents.mdx,cacheHandlers.mdx,cacheLife.mdx,compress.mdx,crossOrigin.mdx,cssChunking.mdx,devIndicators.mdx,distDir.mdx,env.mdx,expireTime.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,htmlLimitedBots.mdx,httpAgentOptions.mdx,images.mdx,incrementalCacheHandlerPath.mdx,inlineCss.mdx,isolatedDevBuild.mdx,logging.mdx,mdxRs.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactCompiler.mdx,reactMaxHeadersLength.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,sassOptions.mdx,serverActions.mdx,serverComponentsHmrCache.mdx,serverExternalPackages.mdx,staleTimes.mdx,staticGeneration.mdx,taint.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,turbopackFileSystemCache.mdx,typedRoutes.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,viewTransition.mdx,webVitalsAttribution.mdx,webpack.mdx}|01-app/03-api-reference/05-config:{02-typescript.mdx,03-eslint.mdx}|01-app/03-api-reference/06-cli:{create-next-app.mdx,next.mdx}|02-pages/01-getting-started:{01-installation.mdx,02-project-structure.mdx,04-images.mdx,05-fonts.mdx,06-css.mdx,11-deploying.mdx}|02-pages/02-guides:{analytics.mdx,authentication.mdx,babel.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,lazy-loading.mdx,mdx.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,post-css.mdx,preview-mode.mdx,production-checklist.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx}|02-pages/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|02-pages/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|02-pages/02-guides/upgrading:{codemods.mdx,version-10.mdx,version-11.mdx,version-12.mdx,version-13.mdx,version-14.mdx,version-9.mdx}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.mdx,02-dynamic-routes.mdx,03-linking-and-navigating.mdx,05-custom-app.mdx,06-custom-document.mdx,07-api-routes.mdx,08-custom-error.mdx}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.mdx,02-static-site-generation.mdx,04-automatic-static-optimization.mdx,05-client-side-rendering.mdx}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.mdx,02-get-static-paths.mdx,03-forms-and-mutations.mdx,03-get-server-side-props.mdx,05-client-side.mdx}|02-pages/03-building-your-application/06-configuring:{12-error-handling.mdx}|02-pages/04-api-reference:{06-edge.mdx,08-turbopack.mdx}|02-pages/04-api-reference/01-components:{font.mdx,form.mdx,head.mdx,image-legacy.mdx,image.mdx,link.mdx,script.mdx}|02-pages/04-api-reference/02-file-conventions:{instrumentation.mdx,proxy.mdx,public-folder.mdx,src-folder.mdx}|02-pages/04-api-reference/03-functions:{get-initial-props.mdx,get-server-side-props.mdx,get-static-paths.mdx,get-static-props.mdx,next-request.mdx,next-response.mdx,use-params.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,userAgent.mdx}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,assetPrefix.mdx,basePath.mdx,bundlePagesRouterDependencies.mdx,compress.mdx,crossOrigin.mdx,devIndicators.mdx,distDir.mdx,env.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,httpAgentOptions.mdx,images.mdx,isolatedDevBuild.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,serverExternalPackages.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,webVitalsAttribution.mdx,webpack.mdx}|02-pages/04-api-reference/04-config:{01-typescript.mdx,02-eslint.mdx}|02-pages/04-api-reference/05-cli:{create-next-app.mdx,next.mdx}|03-architecture:{accessibility.mdx,fast-refresh.mdx,nextjs-compiler.mdx,supported-browsers.mdx}|04-community:{01-contribution-guide.mdx,02-rspack.mdx}<!-- NEXT-AGENTS-MD-END -->
