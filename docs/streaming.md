# Streaming & Suspense

Streaming lets your page load in pieces instead of all at once. Users see content faster, and slow parts don't block fast parts.

## How It Works

1. Next.js sends the page shell immediately (HTML structure, headings, layout chrome)
2. Each `<Suspense>` boundary shows its fallback skeleton
3. When data loads, the real content replaces the skeleton
4. Each section does this independently

**Reference code**: `app/(author)/page.tsx`, `components/author-dashboard/`, `docs/data-fetching.md`

> **Note on current state:** Axiom has no skeleton components or `loading.tsx` / `error.tsx` files yet. These need to be created alongside the server-first refactor. See [data-fetching.md](./data-fetching.md) for the overall pattern.

---

## Why Use Suspense?

Without Suspense:
```
User waits for all queries → Sees entire page at once (or a full-page spinner)
```

With Suspense:
```
Immediately        → Page shell + skeletons visible
After fast query   → Stats cards appear
After slower query → Papers table appears
```

Users feel the page is faster even if total data load time is the same.

---

## Basic Pattern

```tsx
// app/(author)/page.tsx — static shell, no 'use client'
import { Suspense } from 'react';
import { StatsSkeleton } from '@/components/author-dashboard/StatsSkeleton';
import { PapersTableSkeleton } from '@/components/author-dashboard/PapersTableSkeleton';
import { StatsSection } from '@/components/author-dashboard/StatsSection';
import { PapersSection } from '@/components/author-dashboard/PapersSection';

export default function AuthorDashboard() {
  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      {/* Shows immediately — no data needed */}
      <div className="mb-8">
        <h1 className="text-[28px] font-normal italic text-[#e8e0d4]">Author Dashboard</h1>
        <p className="text-[13px] text-[#6a6050] mt-1.5 italic">
          Manage your research, contracts, and submissions
        </p>
      </div>

      {/* Streams in independently */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      {/* Streams in independently */}
      <Suspense fallback={<PapersTableSkeleton />}>
        <PapersSection />
      </Suspense>
    </div>
  );
}
```

---

## Writing Skeletons

Skeletons don't exist in the codebase yet. Create them alongside each async Server Component. They live in the same `components/{domain}/` directory as the component they stand in for.

**Rules:**
- Match the layout of the real content (same grid, approximate card heights)
- Use the same background/border values as the real component
- Animate with a pulsing opacity to signal loading

### Skeleton base style

The dark theme pulse uses a low-opacity background cycling between two values:

```tsx
// Reusable pulse class — add to globals.css if used broadly,
// or inline as a keyframe style on the element.
// Tailwind v4: use animate-pulse (maps to opacity 1 → 0.5 → 1)
```

### Example: stats row skeleton

```tsx
// components/author-dashboard/StatsSkeleton.tsx
export function StatsSkeleton() {
  return (
    <div className="flex gap-4 mb-8 flex-wrap">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 min-w-[160px] rounded-lg p-5 animate-pulse"
          style={{
            background: 'rgba(45,42,38,0.5)',
            border: '1px solid rgba(120,110,95,0.15)',
            minHeight: 88,
          }}
        />
      ))}
    </div>
  );
}
```

### Example: table skeleton

```tsx
// components/author-dashboard/PapersTableSkeleton.tsx
export function PapersTableSkeleton() {
  return (
    <div
      className="rounded-lg overflow-hidden animate-pulse"
      style={{ border: '1px solid rgba(120,110,95,0.15)' }}
    >
      {/* Header row */}
      <div
        className="px-5 py-3"
        style={{ background: 'rgba(30,28,24,0.6)', borderBottom: '1px solid rgba(120,110,95,0.1)' }}
      >
        <div className="h-3 w-32 rounded" style={{ background: 'rgba(120,110,95,0.2)' }} />
      </div>

      {/* Data rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-5 py-4"
          style={{ borderBottom: '1px solid rgba(120,110,95,0.08)' }}
        >
          <div className="h-3 flex-1 rounded" style={{ background: 'rgba(120,110,95,0.12)' }} />
          <div className="h-3 w-20 rounded" style={{ background: 'rgba(120,110,95,0.08)' }} />
          <div className="h-3 w-16 rounded" style={{ background: 'rgba(120,110,95,0.08)' }} />
        </div>
      ))}
    </div>
  );
}
```

---

## When to Add Suspense Boundaries

Add a `<Suspense>` around any async Server Component that:
- Fetches data from the DB via `features/`
- Could be slow independently of other sections
- Should not block the rest of the page

**One boundary per independent section.** Don't wrap the entire page in one Suspense.

| Section | Needs Suspense? |
|---------|----------------|
| Page heading / title | No — static |
| Stats cards (from DB) | Yes |
| Papers table (from DB) | Yes |
| Quick Actions (static links) | No |
| Tab bar (client UI) | No |

---

## `loading.tsx` vs `<Suspense>`

Next.js supports `loading.tsx` files which create an automatic Suspense boundary for the whole route segment:

```
app/
├── (author)/
│   ├── page.tsx
│   └── loading.tsx    # Shows while page.tsx's async work resolves
```

| | `loading.tsx` | `<Suspense>` |
|---|---|---|
| Scope | Entire route segment | Individual section within a page |
| When to use | Page-level transitions (navigating to the route) | Section-level streaming within a page |

Use both: `loading.tsx` for the navigation transition, `<Suspense>` for granular section streaming within the page.

---

## `error.tsx`

If an async Server Component throws (DB error, network failure), Next.js shows the nearest `error.tsx`:

```
app/
├── (author)/
│   ├── page.tsx
│   ├── loading.tsx
│   └── error.tsx      # Catches errors from page.tsx and its children
```

```tsx
// app/(author)/error.tsx
'use client'; // error boundaries must be client components

export default function AuthorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="max-w-[1200px] mx-auto px-10 py-16 text-center"
    >
      <p className="text-[13px] text-[#d4645a] mb-4">
        Something went wrong loading this page.
      </p>
      <button
        onClick={reset}
        className="rounded py-2 px-4 text-sm font-serif cursor-pointer"
        style={{
          background: 'rgba(201,164,74,0.08)',
          border: '1px solid rgba(201,164,74,0.25)',
          color: '#c9a44a',
        }}
      >
        Try again
      </button>
    </div>
  );
}
```

---

## Nested Suspense

You can nest Suspense boundaries when a section itself contains independently loading sub-sections:

```tsx
<Suspense fallback={<PaperDetailSkeleton />}>
  <PaperDetailSection paperId={id}>
    {/* inner sections that load independently */}
    <Suspense fallback={<VersionsSkeleton />}>
      <VersionsTab paperId={id} />
    </Suspense>

    <Suspense fallback={<ReviewsSkeleton />}>
      <ReviewsTab paperId={id} />
    </Suspense>
  </PaperDetailSection>
</Suspense>
```

---

## Common Mistakes

### One big Suspense around everything

```tsx
// DON'T — nothing renders until everything loads
<Suspense fallback={<FullPageSpinner />}>
  <StatsSection />
  <PapersSection />
  <ActivitySection />
</Suspense>
```

```tsx
// DO — each section streams independently
<Suspense fallback={<StatsSkeleton />}>
  <StatsSection />
</Suspense>
<Suspense fallback={<PapersTableSkeleton />}>
  <PapersSection />
</Suspense>
```

### Generic text fallback instead of a skeleton

```tsx
// DON'T
<Suspense fallback={<div>Loading...</div>}>
```

```tsx
// DO — match the shape of the real content
<Suspense fallback={<PapersTableSkeleton />}>
```

### Wrapping static (non-async) components

```tsx
// DON'T — QuickActions is static, no Suspense needed
<Suspense fallback={<Skeleton />}>
  <QuickActions />
</Suspense>
```

```tsx
// DO — only wrap async Server Components
<QuickActions />
<Suspense fallback={<PapersTableSkeleton />}>
  <PapersSection />
</Suspense>
```

---

## Tips

1. **Static content outside Suspense** — headings, quick actions, tab bars don't need to wait
2. **Match skeleton to content** — same grid columns, approximate row heights; avoids layout shift
3. **One boundary per independent section** — let each stream on its own
4. **Test with slow DB** — add `await new Promise(r => setTimeout(r, 2000))` temporarily in a query to see the skeleton in dev
