# Engineering Standards

This document describes the rules and patterns we follow in Axiom. For code examples, see the other docs in this folder.

## Folder Structure

**Rule**: All source code lives under `src/`. Feature-specific code goes in `src/features/{domain}/` with co-located components, hooks, types, and config. Shared utilities go in `src/shared/`.

**Why**: Keeps related code together. When you work on papers, everything is in `src/features/papers/`. Shared UI and utilities live in `src/shared/`.

```
src/
├── app/                          # Pages, API routes, layouts
│   ├── (protected)/{role}/       # Role-specific pages
│   └── api/                      # API route handlers
├── features/{domain}/
│   ├── index.ts                  # Re-exports (server contexts only)
│   ├── queries.ts                # Drizzle reads (server-only)
│   ├── actions.ts                # Drizzle writes (server-only)
│   ├── types.ts                  # TypeScript interfaces
│   ├── hooks/                    # Client-side hooks
│   ├── reducers/                 # Pure state machines
│   ├── config/                   # Step definitions, constants
│   ├── components/               # Feature-specific components
│   │   └── {subdomain}/          # Component groups
│   └── context/                  # React context providers
└── shared/
    ├── components/               # Cross-feature UI (TopBar, Sidebar, ErrorAlert, etc.)
    ├── context/                  # Global context (UserContext, SidebarContext)
    ├── hooks/                    # Shared hooks
    ├── lib/                      # Utilities (auth, db, hedera, hashing, etc.)
    └── types/                    # Shared TypeScript types
```

**Established domains**: `researcher`, `editor`, `reviewer`, `papers`, `contracts`, `reviews`, `rebuttals`, `notifications`, `auth`, `users`, `verify`

### Naming conventions

| What | Convention | Example |
|------|-----------|---------|
| Component files | PascalCase | `ContributorRow.tsx` |
| Client boundary files | `.client.tsx` suffix | `tabs.shell.client.tsx` |
| Hook files | camelCase | `useContractBuilder.ts` |
| Types / mock data | kebab-case | `paper-registration.ts` |
| Domain directories | kebab-case or lowercase | `paper-registration/`, `contract/` |
| API route segments | `[id]` not `[paperId]` | `papers/[id]/route.ts` |

---

## Feature Import Rule

**Rule**: Import from sub-files directly, never from the feature root index.

**Why**: Barrel imports can pull server-only code (Drizzle, `next/headers`) into client bundles, causing build failures or bundle bloat.

```ts
// ✅ correct
import { listUserPapers } from '@/src/features/papers/queries';
import { ContributorTable } from '@/src/features/researcher/components/contract/ContributorTable';

// ❌ wrong — may pull server code into client bundle
import { listUserPapers } from '@/src/features/papers';
```

Feature `index.ts` files exist for convenience in server contexts (API routes, Server Components) but must never be imported from client components.

---

## Server-First Page Pattern

Every page follows this decomposition:

```
src/app/{role}/page.tsx                              # Async Server Component — getSession() + queries → initialData
src/app/{role}/loading.tsx                           # Skeleton (Suspense fallback)
src/app/{role}/error.tsx                             # 'use client' error boundary
src/features/{domain}/components/{Name}.client.tsx   # 'use client' boundary — accepts initialData
src/features/{domain}/hooks/use{Domain}.ts           # 'use client' hook — UI state only
src/features/{domain}/components/                    # Presentational components
```

**The split:** server fetches, client interacts.

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

---

## Data Fetching

**Rule**: Fetch data in async Server Components by calling `src/features/` queries directly. Do not fetch page data from client hooks.

**Why**: Eliminates the client -> API -> DB waterfall. Data arrives with the first HTML response. No loading spinner on initial render.

**When client fetching is still appropriate**: Mutations triggered by user interaction (sign contract, upload paper) that need to call API routes after a browser-side step (wallet signing, file hashing).

See [data-fetching.md](./data-fetching.md) for the full pattern.

---

## Server Actions & Mutations

**Rule**: Feature actions (`src/features/{domain}/actions.ts`) are plain TypeScript Drizzle write functions -- no auth, no HTTP. Auth and input validation live in the API route handler or Next.js Server Action that calls them.

**Why**: Keeps the DB layer testable and reusable without coupling it to HTTP concerns.

See [server-actions.md](./server-actions.md) for the full pattern.

---

## Validation

**Rule**: Use `createInsertSchema(table)` from `drizzle-zod` for runtime validation in API routes. Don't duplicate the DB schema manually.

**Why**: The DB schema is the single source of truth. `drizzle-zod` generates Zod schemas from it automatically.

```ts
import { createInsertSchema } from 'drizzle-zod';
import { papers } from '@/src/shared/lib/db/schema';

const insertPaperSchema = createInsertSchema(papers);
```

For fields not in the DB schema, extend with `.extend()`:

```ts
const schema = createInsertSchema(papers).extend({
  customField: z.string().min(1),
});
```

---

## Authentication

**Rule**: Every mutating API route and Server Action must call `getSession()` first and return 401/redirect if it returns `null`.

```ts
import { getSession } from '@/src/shared/lib/auth/auth';

const wallet = await getSession(); // returns lowercase wallet address or null
if (!wallet) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

**On the client**: Use `useUser()` from `@/src/shared/context/UserContext.tsx` to read wallet state. Never call `getSession()` from a client component -- it uses `next/headers` which is server-only.

**Wallet addresses**: Always lowercase. All feature actions call `.toLowerCase()` on wallet inputs -- the session already returns lowercase, but normalise at the boundary anyway.

---

## Web3 Specifics

**Hedera SDK routes**: Must include `export const runtime = 'nodejs'` -- the Hedera SDK uses Node.js APIs and will fail in the Edge runtime.

**Client-side hashing**: All SHA-256 hashing uses `@/src/shared/lib/hashing.ts` (Web Crypto API). Never hash on the server for content that will be verified by users -- they need to reproduce the hash themselves.

**Canonical JSON**: Always use `canonicalJson()` from `@/src/shared/lib/hashing.ts` before hashing contract objects. Never use `JSON.stringify()` directly -- key order is non-deterministic and produces different hashes.

**Lit encryption timing**: Encrypt files client-side **before** uploading to IPFS. The on-chain hash must be of the original unencrypted content.

**Reviewer anonymity**: The `reviewerRatings` table has no `authorDid` or `raterId` column by design. Never add one.

---

## Styling

**Rule**: Use Tailwind utility classes for layout. Use inline `style={{}}` for `rgba()` color values.

**Why**: Tailwind v4 arbitrary value syntax for rgba is verbose. Inline styles are clearer for the semi-transparent palette this project uses.

```tsx
// DO -- Tailwind for layout, inline for rgba colors
<div
  className="rounded-lg p-6 mb-5"
  style={{ background: 'rgba(45,42,38,0.5)', border: '1px solid rgba(120,110,95,0.2)' }}
>

// DON'T -- arbitrary rgba in Tailwind class
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

## Component Composition Patterns

### Shared Primitives

Extract repeated UI patterns into shared components in `src/shared/components/`:

| Component | Purpose |
|---|---|
| `ErrorAlert` | Standardized error message display |
| `ReviewField` | Label + styled content block (renders nothing when value is falsy) |
| `CompactSearchInput` | Compact search input for dense panels |
| `PulseBlock` | Animated loading placeholder for skeletons |

### Eliminating Boolean Prop Proliferation

When a component has 3+ boolean props controlling render variants, split into explicit variant components:

```tsx
// ❌ One component with booleans
<ContributorRow isCurrentUser={...} hasSigned={...} isValid={...} showAddRow={...} />

// ✅ Explicit variants
<CurrentUserContributorRow contributor={c} isLast={isLast} />
<ExternalContributorRow contributor={c} isLast={isLast} />
```

### Context for Prop Drilling

When props pass through 3+ levels unchanged, introduce a Context provider:

```tsx
// Context holds state + actions + meta
const ContractContext = createContext<ContractContextValue | null>(null);

// Parent builds the value
<ContractContext value={contextValue}>
  <ContributorTable />   {/* reads from context -- zero props */}
  <ContractPreview />    {/* reads from context -- zero props */}
</ContractContext>

// Children consume via hook
function useContractContext() {
  const ctx = use(ContractContext);
  if (!ctx) throw new Error("...");
  return ctx;
}
```

### Conditional Rendering -> Explicit Variants

Replace stacked conditionals with a thin selector component:

```tsx
// ❌ One component with nested conditionals
if (!allReviewsComplete) return <WaitingMessage />;
if (!canMakeDecision) return <AuthorStatusMessage ... />;
return <FullDecisionForm ... />;

// ✅ Thin selector delegating to focused variants
export function FinalDecisionPanel(props) {
  if (!props.allReviewsComplete) return <WaitingForReviewsPanel />;
  if (!props.canMakeDecision) return <WaitingForAuthorPanel ... />;
  return <DecisionReadyPanel ... />;
}
```

### Shared Constants

Extract duplicated constants into shared modules:

```ts
// src/shared/lib/auth/connect-auth.ts
export const CONNECT_AUTH = { isLoggedIn, getLoginPayload, doLogin, doLogout } as const;
```

---

## Server Components vs Client Components

**Default**: Server Component (no directive needed).

**Add `'use client'` only when the component needs**:
- `useState`, `useEffect`, `useMemo`, or any React hook
- Browser APIs (`window`, `document`, `localStorage`)
- Event handlers passed as props from interactive parent components
- Thirdweb wallet context (`useUser()`)

**`'use client'` is contagious** -- any component that imports a client component becomes client-side too. Keep the client boundary as deep in the tree as possible.

**Never import** `@/src/shared/lib/db`, `@/src/shared/lib/auth`, or anything from `@/src/features/` queries/actions into a client component. These are server-only modules.

---

## React 19 Conventions

### `use()` for Context

Use React 19's `use()` instead of `useContext()` in context consumer hooks:

```ts
import { use } from "react";

export function useUser(): UserContextValue {
  const ctx = use(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
```

### `<Context value>` Syntax

React 19 supports rendering Context directly without `.Provider`:

```tsx
// ✅ React 19
<ContractContext value={contextValue}>
  <Children />
</ContractContext>

// ❌ Old pattern
<ContractContext.Provider value={contextValue}>
  <Children />
</ContractContext.Provider>
```

---

## Performance Patterns

- **Non-blocking side effects**: Use `after()` from `next/server` in API routes to defer HCS anchoring, reputation minting, and notification creation after the response is sent.
- **Provider code splitting**: `ThirdwebProvider` + `UserProvider` extracted into `providers.client.tsx` client boundary for automatic code splitting.
- **Lit SDK dynamic imports**: `@lit-protocol/*` dynamically imported inside function bodies to defer ~500KB from initial bundle.
- **Hoisted style constants**: Shared inline style objects extracted to module scope to prevent re-creation on every render.
- **Stable callbacks**: Use refs to read state inside `useCallback` to avoid dependency on changing object references.
- **Lazy useState**: Use lazy initializer functions for `useState` to avoid re-computing initial values.
- **SQL-level filtering**: Use PostgreSQL operators (e.g. JSONB `@>`) instead of fetching all records and filtering in JS.

---

## Error Handling

**Rule**: Use Next.js `error.tsx` files for user-facing page errors. Don't expose internal error messages or stack traces.

```
app/(protected)/{role}/
├── page.tsx
├── loading.tsx     # Route-level loading state
└── error.tsx       # Catches thrown errors from page.tsx
```

`error.tsx` must be `'use client'` (required by Next.js). Show a friendly message and a retry button. Log the actual error server-side, not to the client.

See [streaming.md](./streaming.md) for the `error.tsx` pattern.

---

## No localStorage or sessionStorage

**Rule**: Do not use `localStorage` or `sessionStorage` for any state.

**Why**: Auth state lives in an httpOnly JWT cookie (managed by `@/src/shared/lib/auth/auth.ts`). UI state lives in React context or component state. Anything persisted across sessions should be in the DB.

---

## Testing

No automated tests exist in the project yet. When adding tests:

- **What to test**: `@/src/shared/lib/hashing.ts` canonicalization, `@/src/shared/lib/auth/auth.ts` JWT logic, feature action edge cases (null user, missing record)
- **What not to test**: Components that only render data, mock data files
- Use `npx vitest` (preferred for Next.js projects) -- add it to `package.json` before writing tests

---

## Code Quality Checklist

Before finishing any task:

1. `npx tsc --noEmit` -- no TypeScript errors (`npm run build` requires `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` and will fail without it in local dev)
2. `npm run lint` -- no ESLint errors or warnings
3. `npm run format` -- Prettier formatting applied
4. Manually verify the affected page in `npm run dev`

If type-check or lint fail, fix before considering the task done.
