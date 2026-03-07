# Streaming & Suspense

Streaming lets your page load in pieces instead of all at once. Users see content faster, and slow parts don't block fast parts.

## How It Works

1. Next.js sends the page shell immediately (HTML structure, headings, layout chrome)
2. Each `<Suspense>` boundary shows its fallback skeleton
3. When data loads, the real content replaces the skeleton
4. Each section does this independently

**Reference code**: `app/(protected)/researcher/page.tsx`, `src/features/researcher/components/`, `docs/data-fetching.md`

> **Note:** Skeletons, `loading.tsx`, and `error.tsx` boundaries are fully implemented across all role routes. Skeleton components live in `src/features/{role}/components/skeletons.tsx` and use a shared `PulseBlock` component from `src/shared/components/PulseBlock.tsx`.

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
// app/(protected)/researcher/page.tsx — static shell, no 'use client'
import { Suspense } from 'react';
import { StatsSkeleton } from '@/src/features/researcher/components/skeletons';
import { PapersTableSkeleton } from '@/src/features/researcher/components/skeletons';
import { StatsSection } from '@/src/features/researcher/components/StatsSection';
import { PapersSection } from '@/src/features/researcher/components/PapersSection';

export default function ResearcherDashboard() {
  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      {/* Shows immediately — no data needed */}
      <div className="mb-8">
        <h1 className="text-[28px] font-normal italic text-[#e8e0d4]">Researcher Dashboard</h1>
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

Skeleton components are fully implemented across all role routes. The codebase uses a shared `PulseBlock` component from `src/shared/components/PulseBlock.tsx` for animated loading blocks. Skeleton components live in `src/features/{role}/components/skeletons.tsx` and are imported by each route's `loading.tsx` file.

**Rules:**
- Match the layout of the real content (same grid, approximate card heights)
- Use the same background/border values as the real component
- Use `PulseBlock` for individual animated placeholder elements

### PulseBlock

`PulseBlock` is a shared component that renders an animated placeholder block. Pass `className` to control dimensions:

```tsx
import { PulseBlock } from "@/src/shared/components/PulseBlock";

<PulseBlock className="h-4 w-20" />
```

### Example: stats row skeleton

```tsx
// src/features/researcher/components/skeletons.tsx
import { PulseBlock } from "@/src/shared/components/PulseBlock";

export function StatsSkeleton() {
  return (
    <div className="flex gap-4 mb-8 flex-wrap">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex-1 min-w-[160px] rounded-lg p-5"
          style={{ border: "1px solid rgba(120,110,95,0.15)", background: "rgba(45,42,38,0.5)" }}
        >
          <PulseBlock className="h-4 w-20 mb-3" />
          <PulseBlock className="h-7 w-12" />
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
app/(protected)/
├── researcher/
│   ├── page.tsx
│   └── loading.tsx    # Shows while page.tsx's async work resolves
```

Every role route (`researcher/`, `editor/`, `reviewer/`) has a `loading.tsx` that imports skeleton components from `src/features/{role}/components/skeletons.tsx`.

| | `loading.tsx` | `<Suspense>` |
|---|---|---|
| Scope | Entire route segment | Individual section within a page |
| When to use | Page-level transitions (navigating to the route) | Section-level streaming within a page |

Use both: `loading.tsx` for the navigation transition, `<Suspense>` for granular section streaming within the page.

---

## `error.tsx`

If an async Server Component throws (DB error, network failure), Next.js shows the nearest `error.tsx`:

```
app/(protected)/
├── researcher/
│   ├── page.tsx
│   ├── loading.tsx
│   └── error.tsx      # Catches errors from page.tsx and its children
```

```tsx
// app/(protected)/researcher/error.tsx
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
