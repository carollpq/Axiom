# Server Actions & Mutations

This guide explains how mutations (create, update, delete) are structured in Axiom.

## Two Kinds of "Actions"

Axiom uses two distinct layers — don't confuse them:

| Layer | What it is | Where it lives |
|-------|-----------|----------------|
| **Feature actions** | Plain TypeScript functions that write to the DB via Drizzle | `features/{domain}/actions.ts` |
| **Next.js Server Actions** | `'use server'` functions called directly from forms via `useActionState` | `app/actions/` |

Currently `app/actions/` contains only auth (`doLogin`, `doLogout`). All other mutations go through API routes which call feature actions. As the server-first refactor progresses, form-driven mutations (e.g. profile update, ORCID linking) will move to `app/actions/`.

**Reference code**: `features/papers/actions.ts`, `features/contracts/actions.ts`, `app/actions/auth.ts`

---

## Feature Actions (`features/{domain}/actions.ts`)

These are pure Drizzle write functions — no HTTP, no `'use server'`, no form handling. They are called by API route handlers.

### File structure

```
features/
├── papers/
│   ├── index.ts        # Barrel export
│   ├── queries.ts      # Reads
│   └── actions.ts      # Writes
├── contracts/
│   ├── index.ts
│   ├── queries.ts
│   └── actions.ts
└── users/
    ├── index.ts
    └── queries.ts
```

### Naming convention

- **Input types**: `{Verb}{Domain}Input` — e.g. `CreatePaperInput`, `AddContributorInput`
- **Functions**: `{verb}{Domain}` — e.g. `createPaper`, `signContributor`, `updateContractHedera`

### Basic structure

```ts
// features/papers/actions.ts
import { db } from '@/lib/db';
import { papers, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { StudyTypeDb } from '@/lib/db/schema';

export interface CreatePaperInput {
  title: string;
  abstract?: string | null;
  studyType?: StudyTypeDb;
  wallet: string;
}

export function createPaper(input: CreatePaperInput) {
  // 1. Resolve user from wallet address
  const user = db
    .select()
    .from(users)
    .where(eq(users.walletAddress, input.wallet.toLowerCase()))
    .limit(1)
    .get();

  if (!user) return null;

  // 2. Write to DB
  return db
    .insert(papers)
    .values({
      title: input.title,
      abstract: input.abstract ?? null,
      studyType: input.studyType ?? 'original',
      ownerId: user.id,
    })
    .returning()
    .get();
}
```

### Hedera update pattern

Actions that anchor to Hedera HCS follow a two-step write: first create the DB record, then update it with the HCS receipt after submission. Both steps are separate functions:

```ts
// First call: createPaperVersion() → returns version record
// Then submit to HCS
// Then call: updatePaperVersionHedera() → stores txId + timestamp

export function updatePaperVersionHedera(
  versionId: string,
  hederaTxId: string,
  hederaTimestamp: string,
) {
  return db
    .update(paperVersions)
    .set({ hederaTxId, hederaTimestamp })
    .where(eq(paperVersions.id, versionId))
    .returning()
    .get() ?? null;
}
```

This is intentional — the DB record exists before HCS anchoring, and is updated once the receipt arrives. See `app/api/papers/[id]/versions/route.ts` for the full flow.

---

## API Route Handlers

Feature actions are called from API routes in `app/api/`. Routes handle auth, input validation, and HTTP response shaping. Feature actions handle only the DB write.

### Auth check

Every mutating route must verify the session first:

```ts
// app/api/papers/route.ts
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const wallet = await getSession();
  if (!wallet) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ...
}
```

### Input validation

Validate required fields in the route handler before calling the feature action:

```ts
const body = await req.json();
const { title } = body;

if (!title) {
  return NextResponse.json({ error: 'title is required' }, { status: 400 });
}

const paper = createPaper({ ...body, wallet });
```

For more complex validation, use Zod directly (no `drizzle-zod` — keep it simple):

```ts
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  abstract: z.string().optional(),
  studyType: z.enum(['original', 'meta_analysis', 'negative_result', 'replication', 'replication_failed']).optional(),
});

const result = schema.safeParse(body);
if (!result.success) {
  return NextResponse.json(
    { error: result.error.flatten().fieldErrors },
    { status: 400 },
  );
}
```

### Hedera SDK routes

Any route that calls the Hedera SDK must opt out of the Edge runtime:

```ts
export const runtime = 'nodejs'; // Hedera SDK is Node.js only
```

---

## Next.js Server Actions (`app/actions/`)

For form-driven mutations that don't need a separate API route, use `'use server'` functions. These are called via `useActionState` in client forms. See [forms.md](./forms.md) for the full form pattern.

### Structure

```ts
// app/actions/profile.ts
'use server';

import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { updateUser } from '@/features/users/actions';

export type State = {
  errors?: { displayName?: string[] };
  message: string | null;
};

const schema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
});

export async function updateProfile(prevState: State, formData: FormData): Promise<State> {
  // 1. Verify auth
  const wallet = await getSession();
  if (!wallet) return { message: 'Not authenticated.' };

  // 2. Validate
  const result = schema.safeParse({ displayName: formData.get('displayName') });
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors, message: null };
  }

  // 3. Write via feature action
  try {
    await updateUser(wallet, result.data);
  } catch {
    return { message: 'Failed to save. Please try again.' };
  }

  // 4. Redirect outside try/catch (redirect() throws internally)
  redirect('/dashboard');
}
```

### When to use Server Actions vs API routes

| Situation | Use |
|-----------|-----|
| Form submit (profile, ORCID, role selection) | `'use server'` in `app/actions/` + `useActionState` |
| Programmatic mutation (sign contract, upload version) | API route in `app/api/` |
| Wallet signing flow (requires Thirdweb account) | API route — wallet interaction happens client-side first |
| Hedera SDK calls | API route with `export const runtime = 'nodejs'` |

---

## Important Rules

1. **Feature actions are pure DB functions** — no `'use server'`, no HTTP, no auth checks
2. **Auth lives in the route handler or Server Action**, not in feature actions
3. **Wallet addresses are always lowercased** — all feature actions call `.toLowerCase()` on wallet inputs
4. **`redirect()` must be outside try/catch** — it throws `NEXT_REDIRECT` internally, which would be caught as an error
5. **Hedera SDK routes need `export const runtime = 'nodejs'`**
6. **Never put `authorDid` or any reviewer identity in `reviewerRatings`** — reviewer anonymity is by design

---

## Common Mistakes

### Auth inside feature actions

```ts
// DON'T — feature actions don't know about HTTP or sessions
export function createPaper(input: CreatePaperInput) {
  const wallet = await getSession(); // wrong layer
}
```

```ts
// DO — auth in the route handler, wallet passed as input
export async function POST(req: NextRequest) {
  const wallet = await getSession();
  if (!wallet) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const paper = createPaper({ ...body, wallet });
}
```

### Redirect inside try/catch

```ts
// DON'T — redirect() throws and gets caught as an error
try {
  await updateUser(wallet, data);
  redirect('/dashboard'); // caught by catch block!
} catch {
  return { message: 'Error' };
}
```

```ts
// DO — redirect after the try/catch block
try {
  await updateUser(wallet, data);
} catch {
  return { message: 'Error' };
}

redirect('/dashboard');
```

### Missing `runtime = 'nodejs'` on Hedera routes

```ts
// DON'T — Hedera SDK uses Node.js APIs, fails in Edge runtime
export async function POST(req: NextRequest) {
  await submitHcsMessage(topicId, payload); // crashes
}
```

```ts
// DO
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  await submitHcsMessage(topicId, payload);
}
```

### Skipping the null check after a feature action

Feature actions return `null` when the user isn't found or the record doesn't exist. Always check:

```ts
// DON'T
const paper = createPaper({ ...body, wallet });
return NextResponse.json(paper, { status: 201 }); // could return null

// DO
const paper = createPaper({ ...body, wallet });
if (!paper) {
  return NextResponse.json({ error: 'user not found' }, { status: 404 });
}
return NextResponse.json(paper, { status: 201 });
```
