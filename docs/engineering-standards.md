# Engineering Standards

This document describes the rules and patterns we follow in Axiom. For code examples, see the other docs in this folder.

## Folder Structure

**Rule**: Feature-specific code goes in `features/{domain}/`. Shared utilities go in `lib/`. UI components go in `components/{domain}/`.

**Why**: Keeps related code together. When you work on papers, everything is in `features/papers/`, `components/paper-registration/`, and `hooks/usePaperRegistration.ts`.

```
features/{domain}/
├── index.ts          # Barrel export
├── queries.ts        # Drizzle reads (server-only)
└── actions.ts        # Drizzle writes (server-only)

components/{domain}/
├── ComponentName.tsx # One component per file
└── index.ts          # Barrel export

hooks/
└── use{Domain}.ts    # Client-side state and handlers

types/
└── {domain}.ts       # TypeScript interfaces for the domain

lib/
└── {utility}.ts      # Shared utilities (hashing, auth, formatting, etc.)
```

**Established domains**: `dashboard` (author-dashboard), `contract`, `paper-registration`, `explorer`, `journal-dashboard`, `reviewer-dashboard`, `review-workspace`, `onboarding`, `shared`

### Naming conventions

| What | Convention | Example |
|------|-----------|---------|
| Component files | PascalCase | `ContributorRow.tsx` |
| Hook files | camelCase | `useContractBuilder.ts` |
| Types / mock data | kebab-case | `paper-registration.ts` |
| Domain directories | kebab-case or lowercase | `paper-registration/`, `contract/` |
| API route segments | `[id]` not `[paperId]` | `papers/[id]/route.ts` |

---

## Barrel Exports

**Rule**: Each feature domain and component directory exports through an `index.ts` barrel.

**Why**: Keeps imports clean and refactorable — callers import from `@/features/papers` not from deep internal paths.

### Feature barrel (`features/{domain}/index.ts`)

Re-exports queries, actions, and input types. Keep it flat — no re-exporting from nested paths.

```ts
// features/papers/index.ts
export { listUserPapers, getPaperById, listPublicPapers } from './queries';
export { createPaper, updatePaper, createPaperVersion, updatePaperVersionHedera } from './actions';
export type { CreatePaperInput, UpdatePaperInput, CreatePaperVersionInput } from './actions';
```

### Component barrel (`components/{domain}/index.ts`)

Re-exports all components from the domain. Named exports only — no default exports from barrels.

```ts
// components/paper-registration/index.ts
export { PaperDetailsStep } from './PaperDetailsStep';
export { ProvenanceStep } from './ProvenanceStep';
export { StepIndicator } from './StepIndicator';
// ...
```

### What NOT to do

```ts
// DON'T — mixing server-only DB code with client exports
// This causes Next.js to try bundling Drizzle into the client bundle
export * from './queries';    // contains db imports
export * from './components'; // contains 'use client' components
```

Feature barrels are imported **only from server contexts** (API routes, Server Actions, async Server Components). Client components import from `@/types/`, `@/lib/` utilities, or their own hooks — never directly from `@/features/`.

---

## The 4-Layer Decomposition

Every page follows the same structure:

```
types/{domain}.ts              # TypeScript interfaces
lib/mock-data/{domain}.ts      # Fallback/mock data
hooks/use{Domain}.ts           # 'use client' hook: state + handlers
components/{domain}/           # Focused components, barrel-exported
app/(...)/page.tsx             # Thin orchestration, ~40-120 lines
```

As pages are refactored server-first (see [data-fetching.md](./data-fetching.md)), pages become `async` Server Components and hooks become pure UI state machines — but the layer boundaries stay the same.

---

## Data Fetching

**Rule**: Fetch data in async Server Components by calling `features/` queries directly. Do not fetch page data from client hooks.

**Why**: Eliminates the client → API → DB waterfall. Data arrives with the first HTML response. No loading spinner on initial render.

**When client fetching is still appropriate**: Mutations triggered by user interaction (sign contract, upload paper) that need to call API routes after a browser-side step (wallet signing, file hashing).

See [data-fetching.md](./data-fetching.md) for the full pattern.

---

## Server Actions & Mutations

**Rule**: Feature actions (`features/{domain}/actions.ts`) are plain TypeScript Drizzle write functions — no auth, no HTTP. Auth and input validation live in the API route handler or Next.js Server Action that calls them.

**Why**: Keeps the DB layer testable and reusable without coupling it to HTTP concerns.

See [server-actions.md](./server-actions.md) for the full pattern.

---

## Validation

**Rule**: Use Zod for runtime validation in API routes and Server Actions. Define schemas inline in the route/action — don't share validation schemas across routes.

**Why**: Validation rules are specific to each endpoint's contract. Sharing schemas creates coupling.

```ts
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  studyType: z.enum(['original', 'meta_analysis', 'negative_result', 'replication', 'replication_failed']).optional(),
});
```

Do **not** use `drizzle-zod` — it isn't installed and the manual schemas are explicit enough given the small number of routes.

---

## Authentication

**Rule**: Every mutating API route and Server Action must call `getSession()` first and return 401/redirect if it returns `null`.

```ts
import { getSession } from '@/lib/auth';

const wallet = await getSession(); // returns lowercase wallet address or null
if (!wallet) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

**On the client**: Use `useUser()` from `context/UserContext.tsx` to read wallet state. Never call `getSession()` from a client component — it uses `next/headers` which is server-only.

**Wallet addresses**: Always lowercase. All feature actions call `.toLowerCase()` on wallet inputs — the session already returns lowercase, but normalise at the boundary anyway.

---

## Web3 Specifics

**Hedera SDK routes**: Must include `export const runtime = 'nodejs'` — the Hedera SDK uses Node.js APIs and will fail in the Edge runtime.

**Client-side hashing**: All SHA-256 hashing uses `lib/hashing.ts` (Web Crypto API). Never hash on the server for content that will be verified by users — they need to reproduce the hash themselves.

**Canonical JSON**: Always use `canonicalJson()` from `lib/hashing.ts` before hashing contract objects. Never use `JSON.stringify()` directly — key order is non-deterministic and produces different hashes.

**Lit encryption timing**: Encrypt files client-side **before** uploading to R2. The on-chain hash must be of the original unencrypted content.

**Reviewer anonymity**: The `reviewerRatings` table has no `authorDid` or `raterId` column by design. Never add one.

---

## Styling

**Rule**: Use Tailwind utility classes for layout. Use inline `style={{}}` for `rgba()` color values.

**Why**: Tailwind v4 arbitrary value syntax for rgba is verbose. Inline styles are clearer for the semi-transparent palette this project uses.

```tsx
// DO — Tailwind for layout, inline for rgba colors
<div
  className="rounded-lg p-6 mb-5"
  style={{ background: 'rgba(45,42,38,0.5)', border: '1px solid rgba(120,110,95,0.2)' }}
>

// DON'T — arbitrary rgba in Tailwind class
<div className="bg-[rgba(45,42,38,0.5)]">
```

**Color palette**:
- Backgrounds: `#1a1816` / `rgba(45,42,38,...)`
- Text: `#e8e0d4` (primary) / `#d4ccc0` / `#b0a898` / `#8a8070` / `#6a6050` (muted)
- Gold accent: `#c9a44a`
- Green: `#8fbc8f`
- Red: `#d4645a`
- Blue: `#5a7a9a`
- Font: `font-serif` throughout

---

## Error Handling

**Rule**: Use Next.js `error.tsx` files for user-facing page errors. Don't expose internal error messages or stack traces.

```
app/(author)/
├── page.tsx
├── loading.tsx     # Route-level loading state
└── error.tsx       # Catches thrown errors from page.tsx
```

`error.tsx` must be `'use client'` (required by Next.js). Show a friendly message and a retry button. Log the actual error server-side, not to the client.

See [streaming.md](./streaming.md) for the `error.tsx` pattern.

---

## Server Components vs Client Components

**Default**: Server Component (no directive needed).

**Add `'use client'` only when the component needs**:
- `useState`, `useEffect`, `useMemo`, or any React hook
- Browser APIs (`window`, `document`, `localStorage`)
- Event handlers passed as props from interactive parent components
- Thirdweb wallet context (`useUser()`)

**`'use client'` is contagious** — any component that imports a client component becomes client-side too. Keep the client boundary as deep in the tree as possible.

**Never import** `lib/db`, `lib/auth`, or anything from `features/` into a client component. These are server-only modules.

---

## No localStorage or sessionStorage

**Rule**: Do not use `localStorage` or `sessionStorage` for any state.

**Why**: Auth state lives in an httpOnly JWT cookie (managed by `lib/auth.ts`). UI state lives in React context or component state. Anything persisted across sessions should be in the DB.

---

## Testing

No automated tests exist in the project yet. When adding tests:

- **What to test**: `lib/hashing.ts` canonicalization, `lib/auth.ts` JWT logic, feature action edge cases (null user, missing record)
- **What not to test**: Components that only render data, mock data files
- Use `npx vitest` (preferred for Next.js projects) — add it to `package.json` before writing tests

---

## Code Quality Checklist

Before finishing any task:

1. `npx tsc --noEmit` — no TypeScript errors (`npm run build` requires `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` and will fail without it in local dev)
2. `npm run lint` — no ESLint errors or warnings
3. `npm run format` — Prettier formatting applied
4. Manually verify the affected page in `npm run dev`

If type-check or lint fail, fix before considering the task done.
