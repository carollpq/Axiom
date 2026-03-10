# Server Actions & Mutations

This guide explains how mutations (create, update, delete) are structured in Axiom.

## Two Layers

Axiom uses two distinct layers for write operations:

| Layer | What it is | Where it lives |
|-------|-----------|----------------|
| **Server Actions** | `'use server'` async functions — auth, validation, DB write, side effects | `features/{domain}/actions.ts` |
| **Mutations** | Plain TypeScript functions that write to the DB via Drizzle | `features/{domain}/mutations.ts` |

Server actions are the **public mutation API** — they're what client components import and call. Mutations are internal implementation details called only by server actions (and occasionally by API routes or other server-side code).

**Reference code**: `src/features/papers/actions.ts` (server actions), `src/features/papers/mutations.ts` (DB writes), `src/shared/lib/auth/actions.ts` (auth server actions)

---

## File Structure

```
src/features/{domain}/
├── queries.ts      # DB reads (called from Server Components)
├── actions.ts      # 'use server' — auth + validate + mutations + side effects
└── mutations.ts    # Pure Drizzle DB writes (internal, no auth)
```

Every domain follows this pattern. Client components import from `actions.ts`, never from `mutations.ts` or `queries.ts`.

### Auth server actions

Login/logout live separately in `src/shared/lib/auth/actions.ts` since they're cross-cutting concerns, not domain-specific.

---

## Server Actions (`features/{domain}/actions.ts`)

These are the entry points for all client-initiated mutations. They handle:

1. **Auth** — `requireAuth()` from `server-action-helpers.ts` (throws on failure)
2. **Validation** — Zod schemas for input
3. **DB write** — calls mutation functions from `mutations.ts`
4. **Side effects** — HCS anchoring, HTS minting, notifications (often via `after()`)

### Basic structure

```ts
// src/features/papers/actions.ts
'use server';

import { z } from 'zod';
import { requireAuth } from '@/src/shared/lib/server-action-helpers';
import { createPaper } from '@/src/features/papers/mutations';

const createPaperSchema = z.object({
  title: z.string().min(1).max(500),
  abstract: z.string().max(5000),
  studyType: z.enum(['original', 'negative_result', 'replication']).optional(),
});

export async function createPaperAction(input: z.infer<typeof createPaperSchema>) {
  const wallet = await requireAuth();
  const parsed = createPaperSchema.parse(input);

  const paper = await createPaper({ ...parsed, wallet });
  if (!paper) throw new Error('User not found');

  return paper;
}
```

### Naming convention

- **Server actions**: `{verb}{Domain}Action` — e.g. `createPaperAction`, `signContractAction`, `submitReviewAction`
- **Mutations**: `{verb}{Domain}` — e.g. `createPaper`, `signContributor`, `updateContractHedera`

### Auth pattern

Server actions use `requireAuth()` which throws on failure (no `NextResponse`):

```ts
import { requireAuth } from '@/src/shared/lib/server-action-helpers';

export async function myAction(input: MyInput) {
  const wallet = await requireAuth(); // throws if not authenticated
  // ... proceed with wallet
}
```

This differs from the old API route pattern where `requireSession()` returned `string | NextResponse`.

### Calling from client components

Client components call server actions directly — no `fetch`, no JSON parsing:

```ts
'use client';

import { createPaperAction } from '@/src/features/papers/actions';

async function handleSubmit() {
  try {
    const paper = await createPaperAction({ title, abstract, studyType });
    toast.success('Paper created');
    router.refresh(); // revalidate server component data
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong';
    toast.error(message);
  }
}
```

**Key differences from old API route pattern:**
- No `fetch()` / `res.ok` / `res.json()` — call the function directly
- Errors are thrown, not returned as HTTP status codes — use `try/catch`
- Call `router.refresh()` after mutations to revalidate server component data

### Hedera side effects with `after()`

Server actions that perform secondary work (HCS anchoring, HTS minting, notification creation) after the critical DB write use `after()` from `next/server` to defer those operations:

```ts
'use server';

import { after } from 'next/server';
import { requireAuth, anchorAndNotify, recordReputation } from '@/src/shared/lib/server-action-helpers';
import { createReview } from '@/src/features/reviews/mutations';

export async function submitReviewAction(assignmentId: string, input: ReviewInput) {
  const session = await requireAuth();

  // Critical DB write — must complete before returning
  const review = await createReview({ ...input, reviewerWallet: session });
  if (!review) throw new Error('Failed to create review');

  // Non-blocking: HCS anchoring, reputation, status transitions run after response
  after(async () => {
    await anchorAndNotify({ topic: 'HCS_TOPIC_REVIEWS', payload: { ... } });
    await recordReputation(session, 'review_completed', 1, ...);
  });

  return { reviewId: review.id };
}
```

**Server actions using `after()`:** `submitReviewAction`, `signContractAction`, `assignReviewersAction`, `makeDecisionAction`, `authorResponseAction`, `resolveRebuttalAction`

### Special case: "already exists" responses

When a mutation would be a no-op (e.g. rating already submitted), return a status flag instead of throwing:

```ts
export async function rateReviewerAction(reviewId: string, input: RatingInput) {
  // ...
  const existing = await db.query.reviewerRatings.findFirst({ ... });
  if (existing) return { alreadyRated: true }; // don't throw — caller handles gracefully

  // ... proceed with rating
  return { alreadyRated: false, ratingId, overallRating };
}
```

---

## Mutations (`features/{domain}/mutations.ts`)

Pure Drizzle write functions — no `'use server'`, no HTTP, no auth checks. Called by server actions and (rarely) by API routes or cron jobs.

### Basic structure

```ts
// src/features/papers/mutations.ts
import { db } from '@/src/shared/lib/db';
import { papers, users } from '@/src/shared/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface CreatePaperInput {
  title: string;
  abstract?: string | null;
  studyType?: StudyTypeDb;
  wallet: string;
}

export async function createPaper(input: CreatePaperInput) {
  const user = (
    await db.select().from(users)
      .where(eq(users.walletAddress, input.wallet.toLowerCase()))
      .limit(1)
  )[0];

  if (!user) return null;

  return (
    await db.insert(papers).values({
      title: input.title,
      abstract: input.abstract ?? null,
      studyType: input.studyType ?? 'original',
      ownerId: user.id,
    }).returning()
  )[0];
}
```

### Naming convention

- **Input types**: `{Verb}{Domain}Input` — e.g. `CreatePaperInput`, `AddContributorInput`
- **Functions**: `{verb}{Domain}` — e.g. `createPaper`, `signContributor`, `updateContractHedera`

### Hedera update pattern

Mutations that anchor to Hedera HCS follow a two-step write: first create the DB record, then update it with the HCS receipt. Both steps are separate functions:

```ts
// First call: createPaperVersion() → returns version record
// Then submit to HCS (in server action or after() callback)
// Then call: updatePaperVersionHedera() → stores txId + timestamp

export async function updatePaperVersionHedera(
  versionId: string,
  hederaTxId: string,
  hederaTimestamp: string,
) {
  return (
    await db.update(paperVersions)
      .set({ hederaTxId, hederaTimestamp })
      .where(eq(paperVersions.id, versionId))
      .returning()
  )[0] ?? null;
}
```

---

## Remaining API Routes

Most mutations have been converted to server actions. The following API routes remain because they require capabilities that server actions don't support:

| Route | Reason |
|---|---|
| `GET /api/papers/[id]/content` | Returns binary PDF bytes with custom headers |
| `GET /api/cron/deadlines` | Called by external cron scheduler with `Authorization: Bearer` |
| `GET/PATCH /api/notifications` | Polled every 30s via `setInterval` |
| `GET /api/reviews/reputation` | Public endpoint used as external URL |
| `POST /api/upload/ipfs` | Multipart `FormData` file upload |
| `GET /api/papers/[id]/reviews` | Public unauthenticated endpoint |
| `GET /api/users/search` | Debounced search on keystroke |
| `GET /api/activity` | Not wired to client yet |
| `GET /api/auth/me` | Session hydration for `UserContext` |
| `GET /api/papers/[id]` | Public paper metadata |

API routes that call mutation functions follow the same pattern — auth via `requireSession()`, then call mutations from `mutations.ts`.

---

## Shared Helpers

`src/shared/lib/server-action-helpers.ts` provides common guards and utilities for server actions:

| Helper | Purpose |
|---|---|
| `requireAuth()` | Auth guard — throws if no session |
| `requireSubmissionEditor(id, session)` | Verifies editor owns the submission's journal |
| `requireRebuttalAuthor(id, session)` | Verifies author owns the rebuttal's submission |
| `requireRebuttalEditor(id, session)` | Verifies editor owns the rebuttal's journal |
| `requireReviewWithPaperOwner(id, session)` | Verifies paper owner for rating |
| `anchorToHcs(topic, payload)` | Submit HCS message (graceful fallback) |
| `anchorAndNotify({ topic, payload, notifications })` | HCS + notifications in one call |
| `recordReputation(wallet, event, delta, memo, metadata)` | Reputation event + HTS mint |

These mirror the older `src/shared/lib/api-helpers.ts` but throw errors instead of returning `NextResponse`.

---

## Important Rules

1. **Mutations are pure DB functions** — no `'use server'`, no HTTP, no auth checks
2. **Auth lives in server actions**, not in mutations
3. **Wallet addresses are always lowercased** — mutations call `.toLowerCase()` on wallet inputs
4. **`redirect()` must be outside try/catch** — it throws `NEXT_REDIRECT` internally
5. **Never put `authorDid` or any reviewer identity in `reviewerRatings`** — anonymity by design
6. **Use `after()` for non-critical side effects** — return immediately after the DB write; defer HCS, HTS, and notifications
7. **All exports in a `'use server'` file must be async** — non-async exports cause Turbopack build errors

---

## Common Mistakes

### Auth inside mutations

```ts
// DON'T — mutations don't know about sessions
export async function createPaper(input: CreatePaperInput) {
  const wallet = await getSession(); // wrong layer
}
```

```ts
// DO — auth in the server action, wallet passed as input
export async function createPaperAction(input: Input) {
  const wallet = await requireAuth();
  const paper = await createPaper({ ...input, wallet });
}
```

### Non-async export in 'use server' file

```ts
// DON'T — Turbopack rejects non-async exports in 'use server' files
'use server';

export function daysFromNow(days: number): string { // build error!
  return new Date(Date.now() + days * 86_400_000).toISOString();
}
```

```ts
// DO — move utility functions to a separate file, or make them non-exported
function daysFromNow(days: number): string { // private — not exported
  return new Date(Date.now() + days * 86_400_000).toISOString();
}
```

### Importing mutations from client components

```ts
// DON'T — mutations.ts uses server-only modules (db, drizzle)
'use client';
import { createPaper } from '@/src/features/papers/mutations'; // build failure!
```

```ts
// DO — import server actions (which are 'use server')
'use client';
import { createPaperAction } from '@/src/features/papers/actions';
```

### Skipping the null check after a mutation

Mutations return `null` when the user isn't found or the record doesn't exist. Always check:

```ts
// DON'T
const paper = await createPaper({ ...input, wallet });
return paper; // could return null

// DO
const paper = await createPaper({ ...input, wallet });
if (!paper) throw new Error('User not found');
return paper;
```
