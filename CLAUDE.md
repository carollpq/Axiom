# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

Axiom is a blockchain-backed academic publishing and peer review platform built on Hedera. It focuses on making the **review process** fair, transparent, and accountable — without disrupting journal revenue models. Journals publish review criteria on-chain, reviewers build portable soulbound reputation, authors get real-time updates and the right to rebut unfair reviews, and all commitments are cryptographically enforced.

**Hackathon:** Hedera Hello Future: Apex 2026

### Project Status

The codebase is a **functional full-stack application**. The researcher and editor sections have full backend integration with DB-backed data. The reviewer section still uses mock data for the dashboard UI but has complete API routes.

**What's working end-to-end:**
- ✅ **User authentication** — Multi-step login: role selector → wallet connect → ORCID verification → DB save → role-based dashboard routing
- ✅ **Paper registration** — Client-side SHA-256 hashing → IPFS upload (web3.storage) → Lit encryption → DB storage → Hedera HCS anchoring
- ✅ **Authorship contracts** — Creation + wallet signing (verified via viem `verifyMessage`) → HCS anchoring per signature. Modification → signature invalidation.
- ✅ **Paper submission** — `POST /api/papers/[id]/submit` → `submissions` row → HCS anchor → status `submitted`
- ✅ **Editor dashboard** — DB-backed submission pipeline (incoming → criteria published → reviewers assigned → under review → rebuttal → decision)
- ✅ **Review criteria publishing** — `POST /api/submissions/[id]/criteria` → canonical JSON hash → HCS anchor → immutable criteria
- ✅ **Reviewer assignment** — `POST /api/submissions/[id]/assign-reviewer` → `reviewAssignments` row with deadline tracking
- ✅ **Review submission** — `POST /api/reviews/[id]` → per-criterion evaluations → hash → HCS anchor → reputation token minting
- ✅ **Editorial decision** — `POST /api/submissions/[id]/decision` → `allCriteriaMet` computation → HCS anchor → reputation events
- ✅ **Rebuttal phase** — Researcher-initiated → researcher responds per-review → editor resolves → HCS anchored → reputation tokens minted
- ✅ **Timeline enforcement** — Cron job at `/api/cron/deadlines` marks overdue assignments → `review_late` reputation tokens
- ✅ **Notifications** — DB-backed with NotificationBell component, 30s polling, integrated across all pipeline stages
- ✅ **`/verify` page** — Public PDF upload → client-side hash → DB lookup → verification result
- ✅ **Review transparency** — `GET /api/papers/[id]/reviews` returns anonymized reviews after final decision (confidentialEditorComments always excluded)
- ✅ **Anonymous 5-protocol reviewer ratings** — `POST /api/reviews/[id]/rate` with 5-dimensional rating (actionable feedback, deep engagement, fair/objective, justified recommendation, appropriate expertise) + optional anonymous comment. NO author reference stored.
- ✅ **PDF viewer** — react-pdf v10 / pdfjs-dist v5 in editor three-column views
- ✅ **Researcher dashboard** — Real DB data + public explorer + pending actions (including rebuttal links)
- ✅ **Co-author paper visibility** — `listUserPapers` returns both owned papers and papers where wallet is a contributor on any authorship contract
- ✅ **Viewed by Editor status** — `POST /api/submissions/[id]/view` → transitions `submitted` → `viewed_by_editor` → HCS anchor → researcher notification
- ✅ **Reviewer assignment acceptance** — `POST /api/submissions/[id]/accept-assignment` → reviewer accepts/declines → auto-transitions to `under_review` when 2+ accepted
- ✅ **Author review response** — `POST /api/submissions/[id]/author-response` → researcher accepts reviews or requests rebuttal → HCS anchored
- ✅ **Review-response page** — Researcher views anonymized reviews, rates each (5-protocol), and accepts or requests rebuttal in a single flow
- ✅ **Backend contract validation** — `POST /api/papers/[id]/submit` validates authorship contract is fully signed before submission
- ✅ **Reviewer dashboard** — New layout with performance metrics, researchers insights, profile card, real DB-backed data + API integration
- ✅ **Reviewer invites page** — 3-column layout: left (paper info + abstract preview with pagination), center (PDF viewer), right (journal name, editor, deadline, Accept/Reject buttons)

**What still uses mock data:**
- None — All main features now have DB-backed data integration

**What is not yet implemented:**
- Lit Protocol decryption (encrypt works; decrypt not wired into UI)
- Reviewer search by reputation score in assignment UI
- Hedera mirror node lookups

**Current stack:** Next.js 15 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · Thirdweb v5 · TypeScript strict mode · Neon PostgreSQL/Drizzle ORM · Hedera SDK (HCS + HTS) · Lit Protocol SDK (encrypt only) · web3.storage (IPFS + Filecoin) · react-pdf v10 (pdfjs-dist v5)

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
src/features/{domain}/mappers/{domain}.ts            # Pure mapping functions
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
├── index.ts       # Re-exports
├── queries.ts     # Drizzle read queries
├── actions.ts     # Drizzle write mutations
├── types.ts       # All types for this feature domain
├── hooks/         # Thin hooks (useReducer + side effects only)
├── reducers/      # Pure state machines (testable without React)
└── config/        # Step definitions, constants
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
- ✅ `/verify` page (public PDF hash verification)
- ✅ Review transparency (anonymized reviews public after decision)
- ✅ Anonymous reviewer ratings (no author reference stored)
- ✅ Reviewer dashboard: new layout (performance metrics, profile card, researchers insights) with DB-backed data integration
- ✅ Reviewer invites page: 3-column layout (paper info + abstract preview, PDF viewer, invite info with Accept/Reject)

### Still To Do
1. **Researchers insights population** — `GET /api/reviews/[id]/rate` returns author ratings; need aggregation logic to populate insights feed on reviewer dashboard
2. **Wire Lit decrypt into explorer** — Researchers reading their own private papers.
3. **Reviewer search by reputation** — Editor searches reviewers filtered by score, field, timeliness.
4. **Hedera mirror node lookups** — Verify on-chain data from mirror node.

### Stretch
5. **Timeline enforcement smart contract** (Solidity on Hedera EVM)
6. **HTS minting via System Contracts** (hybrid HTS + EVM)
7. **Real ORCID OAuth flow**

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
│   ├── verify/page.tsx            # Public hash verification page
│   ├── invite/[token]/page.tsx    # Invite claim page
│   ├── api/
│   │   ├── auth/                  # me/ (GET + PATCH)
│   │   ├── activity/route.ts      # GET: activity feed
│   │   ├── contracts/             # CRUD + signing + invite + reset-signatures
│   │   ├── papers/                # CRUD + versions + submit + content + reviews
│   │   ├── journals/route.ts      # GET: list journals
│   │   ├── submissions/[id]/      # criteria/ + assign-reviewer/ + decision/ + view/ + accept-assignment/ + author-response/ + open-rebuttal/ (deprecated)
│   │   ├── reviews/[id]/          # GET/POST review + rate/
│   │   ├── rebuttals/[rebuttalId]/ # respond/ + resolve/
│   │   ├── notifications/route.ts # GET: list + PATCH: mark read
│   │   ├── verify/route.ts        # POST: hash verification (no auth)
│   │   ├── cron/deadlines/route.ts # GET: deadline enforcement cron
│   │   └── upload/ipfs/            # IPFS upload via web3.storage
│   ├── (protected)/
│   │   ├── researcher/            # Dashboard, authorship-contracts, create-submission, view-submissions, paper-version-control (includes paper registration), rebuttal/[submissionId], review-response/[submissionId]
│   │   ├── editor/                # Dashboard, incoming, under-review, accepted, management
│   │   └── reviewer/              # Dashboard, review_workspace/[id]
├── features/
│   ├── auth/                      # Login flow components
│   ├── researcher/                # Components, hooks, reducers, config, constants, mappers, queries, types, nav
│   ├── editor/                    # Components, hooks, queries, mappers, types (DB-backed)
│   ├── reviewer/                  # Components, hooks, reducers, real DB-backed data
│   ├── contracts/                 # DB queries + actions
│   ├── papers/                    # DB queries + actions
│   ├── users/                     # DB queries
│   ├── reviews/                   # DB queries + actions
│   ├── rebuttals/                 # DB queries + actions + hooks + components
│   ├── notifications/             # DB queries + actions + NotificationBell component
│   └── verify/                    # VerifyClient component
└── shared/
    ├── components/                # TopBar, Footer, RoleShell, DashboardHeader, PdfViewer, etc.
    ├── context/UserContext.tsx     # Wallet + session
    ├── hooks/useCurrentUser.ts    # Current user context
    ├── lib/
    │   ├── auth/                  # JWT
    │   ├── db/schema.ts           # Drizzle schema (16 tables)
    │   ├── hedera/client.ts + hcs.ts + hts.ts  # HCS + HTS
    │   ├── lit/                   # Encrypt (decrypt not wired)
    │   ├── hashing.ts             # SHA-256 + canonical JSON
    │   └── storage.ts             # IPFS (web3.storage)
    └── types/                     # Shared types
```

## Coding Conventions

- **TypeScript strict mode** throughout.
- **Server Components** by default. `'use client'` only for browser APIs / interactivity.
- **Imports:** `@/` path alias. Import from sub-files, not feature barrels (see Feature Import Rule).
- **File naming:** Components: PascalCase. Client boundaries: `.client.tsx`. Hooks: camelCase. Types/mock: kebab-case.
- **Dynamic routes:** `[id]` not `[paperId]`.
- **No localStorage/sessionStorage.** React context + httpOnly cookies.
- **API routes using Hedera SDK:** `export const runtime = 'nodejs'`.
- **Graceful degradation:** Hedera, Lit, IPFS all fall back if env vars missing.
- **Auth:** `getSession()` from `@/src/shared/lib/auth/auth`. Never trust wallet from request body.
- **Validation:** `createInsertSchema(table)` from `drizzle-zod`. Don't duplicate DB schema.
- **Canonical JSON:** Always `canonicalJson()` from `lib/hashing.ts` for anything hashed. Never raw `JSON.stringify()`.

## Database

Drizzle ORM. Dev: SQLite. Prod: Neon PostgreSQL. Schema in `src/shared/lib/db/schema.ts`.

**All 16 tables:**
- `users` — wallet, ORCID, role, research fields
- `papers` — title, status, study type, visibility
- `paperVersions` — versions with hashes + Hedera anchoring
- `authorshipContracts` — authorship contracts with status tracking
- `contractContributors` — contributors per contract with signatures + invite tokens
- `journals` — journal metadata (name, editor wallet, reputation)
- `submissions` — paper → journal submissions with status pipeline
- `reviewCriteria` — per-submission criteria (JSONB + hash + HCS tx, immutable)
- `reviewAssignments` — reviewer ↔ submission link with deadline tracking
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
HCS_TOPIC_PAPERS, HCS_TOPIC_CONTRACTS, HCS_TOPIC_SUBMISSIONS
HCS_TOPIC_CRITERIA, HCS_TOPIC_REVIEWS, HCS_TOPIC_DECISIONS, HCS_TOPIC_RETRACTIONS
HTS_REPUTATION_TOKEN_ID

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

## Reviewer Invites Page (`/reviewer/invites`)

### 3-Column Layout

The invite page displays pending assignments in a card-based 3-column layout:
- **Left (3 cols):** Paper info with title, authors (from authorship contracts), abstract preview (paginated), and prev/next buttons
- **Center (6 cols):** PDF viewer (react-pdf v10, powered by pdfjs-dist v5)
- **Right (3 cols):** Invite metadata (journal name, editor wallet, days-to-deadline) + Accept/Reject buttons

### Components

**`invite-card.client.tsx`** - Single invite card component
- Props: `review`, `paperAbstract`, `authors`, `pdfUrl`, `editorName`, `onAccept`, `onReject`, `isLoading`
- Abstract pagination: breaks into ~400-char chunks, navigate with Prev/Next buttons
- Styling: Preserves dark color scheme (#1a1816 bg, #d4ccc0 text, #c9a44a gold accents, #8fbc8f green Accept button)

**`invite-card-list.client.tsx`** - List wrapper with state management
- Accepts array of `AssignedReviewExtended` items
- Manages loading state across all cards + filters out accepted/rejected items
- Shows empty state if no pending invites

### Data Flow

1. **Server side** (`invites/page.tsx`):
   - `listAssignedReviews(wallet)` queries DB with full paper + contributors + versions + journal
   - Maps to base `AssignedReview` + extended version `AssignedReviewExtended`

2. **Mapper** (`mapDbToAssignedReviewExtended`):
   - Extracts authors from authorship contracts (via contributors)
   - Generates PDF URL from latest paperVersion's `fileStorageKey`
   - Pulls journal editor wallet as editor name
   - Includes paper abstract + paper ID + submission ID

3. **Client side** (`IncomingInvitesClient` + `InviteCardList`):
   - Renders list of cards (filters by "Pending" status)
   - On accept/reject: POSTs to `POST /api/submissions/[submissionId]/accept-assignment` with `{ action: "accept" | "decline" }`
   - API response triggers auto-transition to `under_review` if 2+ reviewers accepted
   - Card is removed from DOM on success

### Key Data Additions

**`AssignedReviewExtended` type:**
- Extends base `AssignedReview` with: `abstract`, `authors` (array), `pdfUrl`, `editorName`

**`reviewAssignments` query enhancement:**
- Now fetches `with: { paper: { with: { versions: true, contracts: { with: { contributors: true } } } } }`
- Enables populating all card fields from single query

**`mapDbToAssignedReviewExtended` mapper:**
- New function dedicated to extended data extraction
- Safely handles missing authors or PDF versions (fallbacks to undefined)