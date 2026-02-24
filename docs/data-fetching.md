# Data Fetching

This guide explains how to fetch data correctly in Axiom (Next.js 15 App Router).

## The Target Pattern

We use **async Server Components** with **granular Suspense boundaries**. This means:
1. The page is a static shell (headings, layout chrome) — no `'use client'`, no `async`
2. Each data section is a separate `async` Server Component
3. Each async component is wrapped in `<Suspense>`
4. Client components handle only interactivity (tabs, search, hover, mutations)

> **Note on current state:** Most pages still use the old pattern — `'use client'` on the page, data fetched via `useAuthFetch` in a hook. The refactor moves pages toward the pattern below. The old pattern is documented at the bottom for reference.

**Reference code**: `features/papers/queries.ts`, `features/contracts/queries.ts`, `lib/auth.ts`

---

## Why This Pattern?

- **Fast first paint** — static shell and layout show immediately; data streams in behind it
- **Independent loading** — a slow papers query doesn't block the stats cards from rendering
- **No client waterfall** — data is fetched on the server before HTML is sent; no loading spinner on initial render
- **Simpler hooks** — hooks become pure UI state machines (tabs, filters, hover) with no fetch logic

---

## Basic Example

```tsx
// app/(author)/page.tsx — static shell, no 'use client', no async
import { Suspense } from 'react';
import { PapersTableSkeleton } from '@/components/author-dashboard/PapersTableSkeleton';
import { PapersSection } from '@/components/author-dashboard/PapersSection';

export default function AuthorDashboard() {
  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      <h1 className="text-[28px] font-normal italic text-[#e8e0d4]">
        Author Dashboard
      </h1>

      <Suspense fallback={<PapersTableSkeleton />}>
        <PapersSection />
      </Suspense>
    </div>
  );
}
```

```tsx
// components/author-dashboard/PapersSection.tsx — async Server Component
import { getSession } from '@/lib/auth';
import { listUserPapers } from '@/features/papers/queries';
import { PapersClient } from './PapersClient';

export async function PapersSection() {
  const wallet = await getSession();           // reads JWT cookie — server only
  const papers = wallet ? await listUserPapers(wallet) : [];

  return <PapersClient initialPapers={papers} />;
}
```

```tsx
// components/author-dashboard/PapersClient.tsx — 'use client', interactivity only
'use client';

import { useState, useMemo } from 'react';
import type { Paper } from '@/types/dashboard';

export function PapersClient({ initialPapers }: { initialPapers: Paper[] }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() =>
    initialPapers.filter(p =>
      (statusFilter === 'All' || p.status === statusFilter) &&
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    ), [initialPapers, statusFilter, searchQuery]);

  return (
    // render filtered papers with filter/search controls
  );
}
```

---

## Auth in Server Components

`getSession()` from `lib/auth.ts` reads the httpOnly JWT cookie on the server — no client fetch needed:

```ts
import { getSession } from '@/lib/auth';

export async function MySection() {
  const wallet = await getSession(); // returns lowercase wallet address or null
  if (!wallet) return <p>Not connected.</p>;

  const data = await listUserPapers(wallet);
  // ...
}
```

This works inside any Server Component or `async` function called from one. Do not call `getSession()` from client components — use `useUser()` from `context/UserContext.tsx` there instead.

---

## Queries

All DB reads live in `features/{domain}/queries.ts`. Call them directly from Server Components — no HTTP round-trip, no API route needed for initial page data.

```ts
// features/papers/queries.ts
export function listUserPapers(walletAddress: string) { ... }
export function listPublicPapers() { ... }
export function getPaperById(id: string) { ... }

// features/contracts/queries.ts
export function listUserContracts(walletAddress: string) { ... }
export function getContractById(id: string) { ... }
```

**Naming conventions:**

| Name | Use |
|------|-----|
| `listUser{X}(walletAddress)` | Authenticated user's own records |
| `listPublic{X}()` | Public records (no auth) |
| `get{X}ById(id)` | Single record by ID |

---

## Passing Initial Data to Client Components

Server Components fetch data, then pass it as props to the client component that handles interactivity:

```
async Server Component     — fetches, transforms, passes initialX prop
      ↓
'use client' Component     — useState(initialX), handles tabs/search/hover
```

The client component must **not** re-fetch on mount. The `initialX` prop is the source of truth for first render. Subsequent mutations (sign, upload, etc.) call API routes directly and can call a `refetch` pattern if needed.

---

## Public Data (No Auth)

For the explorer and any unauthenticated pages, call the query directly — no `getSession()` needed:

```tsx
// components/explorer/PapersSection.tsx
import { listPublicPapers } from '@/features/papers/queries';

export async function PapersSection() {
  const papers = await listPublicPapers();
  return <ExplorerClient initialPapers={papers} />;
}
```

---

## Suspense Boundaries

Wrap each async Server Component in `<Suspense>` with a skeleton fallback:

```tsx
<Suspense fallback={<PapersTableSkeleton />}>
  <PapersSection />
</Suspense>

<Suspense fallback={<StatsSkeleton />}>
  <StatsSection />
</Suspense>
```

Keep boundaries granular — one per logical section, not one for the whole page. This lets slow queries stream in without blocking fast ones.

---

## The Old Pattern (Being Phased Out)

The existing pages use client-side fetching via `useAuthFetch`. This is the pattern being replaced:

```tsx
// OLD — page is 'use client', hook fetches on mount
'use client';
export default function AuthorDashboard() {
  const { papers, loading } = useDashboard(); // useAuthFetch inside
  if (loading) return <Spinner />;
  return <PapersTable papers={papers} />;
}
```

Problems with this pattern:
- Page must be `'use client'`, losing RSC benefits
- Loading spinner on every navigation
- Two extra HTTP round-trips (client → `/api/papers` → DB) instead of direct DB call
- Hooks mix data fetching and UI state, making them harder to test and reason about

Do not extend `useAuthFetch` for new page-level data. Use it only for **mutations triggered by user interaction** that need to refetch after success.

---

## Common Mistakes

### Fetching in the page and passing data as props (blocks the whole page)

```tsx
// DON'T — this makes the entire page wait before rendering anything
export default async function Page() {
  const papers = await listUserPapers(wallet);
  return <PapersTable papers={papers} />;
}
```

```tsx
// DO — static shell renders immediately; PapersSection streams in
export default function Page() {
  return (
    <Suspense fallback={<PapersTableSkeleton />}>
      <PapersSection />
    </Suspense>
  );
}
```

### Calling `getSession()` from a client component

```tsx
// DON'T — getSession() uses next/headers which is server-only
'use client';
const wallet = await getSession(); // throws at runtime
```

```tsx
// DO — use UserContext for wallet address on the client
'use client';
const { user } = useUser(); // from context/UserContext.tsx
```

### Forgetting `'use client'` is contagious

If a Server Component imports a client component, the client component stays client-side — that's fine. But if a client component imports a server-only module (e.g. `lib/db`, `lib/auth`), the build will fail. Keep the boundary clean: server modules stay in `features/` and `lib/`; client modules stay in `hooks/` and `components/`.
