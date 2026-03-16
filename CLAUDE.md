# CLAUDE.md

## Project Overview

**Axiom** — Blockchain-backed academic peer review platform on Hedera. Fair, transparent, accountable review process without disrupting journal revenue models. Criteria on-chain, soulbound reviewer reputation, author rebuttals, enforced timelines.

**Hackathon:** Hedera Hello Future: Apex 2026

**Status:** Functional full-stack app. All roles (researcher, editor, reviewer) complete with DB-backed dashboards, all API routes working, all major features wired end-to-end. All major features implemented.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19.2 · Tailwind CSS v4 · Thirdweb v5 · TypeScript strict · Neon PostgreSQL/Drizzle ORM · Hedera SDK (HCS + HTS + Smart Contracts + Mirror Node + Scheduled Transactions) · ethers v6 · Lit Protocol SDK · Pinata (IPFS) · react-pdf v10

## Common Commands

```bash
npm run dev                       # Dev server (Turbopack, localhost:3000)
npm run build                     # Production build
npx tsc --noEmit                  # Type-check only
npm run lint                      # ESLint
npm run format                    # Prettier
npm run contracts:compile         # Compile Solidity (contracts/ has own package.json)
npm run contracts:test            # Hardhat tests
npm run contracts:deploy:testnet  # Deploy TimelineEnforcer to Hedera testnet
```

## Architecture

### Key Differentiators

1. **Structured reviews** — Per-criterion evaluations (yes/no/partially + comment), no vague rejections
2. **Soulbound reputation** — HTS NFTs per review event, portable, non-transferable
3. **Pre-registered criteria** — Immutable on HCS; rejection despite met criteria requires public justification
4. **Rebuttal phase** — Authors challenge unfair reviews; upheld = negative reviewer reputation
5. **Enforced timelines** — On-chain deadlines, late = negative reputation tokens
6. **Transparent reviews** — Anonymized comments public after final decision

**Journals keep:** revenue models, paywalls, subscriptions, APCs unchanged.

### Server-First Page Pattern

```
src/app/{role}/page.tsx                            # Server Component — getSession() + queries → initialData
src/app/{role}/loading.tsx                         # Skeleton fallback
src/app/{role}/error.tsx                           # 'use client' error boundary
src/features/{domain}/components/{Name}.client.tsx # Client boundary — accepts initialData
src/features/{domain}/hooks/use{Domain}.ts         # Hook — UI state only
```

Server fetches, client interacts. Client-only: wallet signing, file hashing, Lit encryption, IPFS uploads. API routes: all mutations.

### Backend Feature Pattern

```
src/features/{domain}/
├── queries.ts / actions.ts / mutations.ts  # Drizzle reads/writes
├── types.ts / lib.ts                       # Types + utilities
├── hooks/ / reducers/ / config/            # UI state, state machines, constants
```

**No barrel `index.ts` files.** Always import from sub-files directly:
```ts
import { listUserPapers } from '@/src/features/papers/queries'; // ✅
```

### Styling

- **Tailwind CSS v4** — `@import "tailwindcss"`, no config file
- Dark palette: bg `#1a1816`, text `#d4ccc0`/`#b0a898`/`#8a8070`, accents `#c9a44a` (gold) / `#8fbc8f` (green) / `#d4645a` (red) / `#5a7a9a` (blue)
- Font: `font-serif` (Georgia). Semi-transparent colors use inline `style`.
- `RoleShell` provides layout chrome — pages should NOT include their own nav.

### Performance

- Provider code splitting (`providers.client.tsx`), Lit SDK dynamic imports, Suspense streaming
- `after()` from `next/server` for non-blocking HCS/HTS/notification side effects
- SQL-level filtering (JSONB `@>`), hoisted style constants, stable callbacks, lazy useState

## Coding Conventions

- TypeScript strict. Server Components by default. `'use client'` only for browser APIs.
- `@/` path alias. Import from sub-files, never feature barrels.
- User lookups: `getUserByWallet()` from `@/src/features/users/queries`. Never inline DB queries.
- File naming: Components PascalCase, client boundaries `.client.tsx`, hooks camelCase.
- Dynamic routes: `[id]` not `[paperId]`. No localStorage — React context + httpOnly cookies.
- Hedera routes: `export const runtime = 'nodejs'`. Graceful fallback if env vars missing.
- Auth: `getSession()` from `@/src/shared/lib/auth/auth`. Never trust wallet from request body.
- Validation: `createInsertSchema(table)` from `drizzle-zod`.
- Hashing: Always `canonicalJson()` from `lib/hashing.ts`. Never raw `JSON.stringify()`.

## Database

Drizzle ORM, Neon PostgreSQL. Schema: `src/shared/lib/db/schema.ts` (16 tables).

**Tables:** users, papers, paperVersions, authorshipContracts, contractContributors, journals, submissions, reviewCriteria, reviewAssignments, reviews, rebuttals, rebuttalResponses, reviewerRatings, reputationEvents, reputationScores, notifications

**Status pipelines:**
- Submission: submitted → viewed_by_editor → criteria_published → reviewers_assigned → under_review → reviews_completed → rebuttal_open → revision_requested/accepted/rejected/published
- Review assignment: assigned → accepted/declined → submitted/late
- Rebuttal: open → submitted → under_review → resolved (upheld/rejected/partial)

**Critical rules:**
- `reputationEvents` is append-only — never update/delete
- `reviewerRatings` has NO author reference column (anonymity by design). Never add one.
- On-chain hash = ORIGINAL unencrypted file, not Lit-encrypted blob

## Key Architecture Details

### Review Criteria
- Canonical JSON → SHA-256 → HCS anchor. IMMUTABLE once published.
- `allCriteriaMet`: all required criteria = 'yes'. If met but rejected → editor provides public justification.

### Rebuttal
- Researcher-initiated via `POST /api/submissions/[id]/author-response` with `action: "request_rebuttal"` (old `open-rebuttal` route returns 410)
- Per-review responses (agree/disagree + justification) → editor resolves → reputation tokens minted
- Upheld = negative for reviewer, rejected = positive

### Reputation (HTS Soulbound)
- Token: `AXIOM_REVIEWER_REPUTATION (AXR)`, non-fungible, non-transferable
- Events: review_completed, review_late, editor_rating, author_rating, paper_published, paper_retracted, rebuttal_upheld/overturned
- Score: `0.30 timeliness + 0.25 editor + 0.25 author + 0.20 publication`

### Timeline Enforcement
| Event | Deadline |
|---|---|
| Assign reviewers | 7d from submission |
| Accept/decline | 3d from assignment |
| Review submission | 21d from acceptance |
| Editorial decision | 7d from reviews complete |
| Rebuttal response | 14d from opening |
| Rebuttal resolution | 7d from submission |

Cron at `/api/cron/deadlines`. Cross-verifies with `TimelineEnforcer.sol` (chain = source of truth).

### Lit Protocol
- Review phase only. NOT for published paper access (journals keep paywall).
- `addReviewersToAccessConditions()` merges wallets on assignment → immediate decryption
- Conditions stored in `papers.litAccessConditionsJson`. Invalid JSON → rebuild from scratch.
- `useDecryptPaper` hook: auto-decrypts if Lit data present, falls back to raw PDF.

### Contracts & Signatures
- Modifying ANY field invalidates ALL signatures
- Fully-signed → Scheduled Transaction (HCS message wrapped). Falls back to direct HCS.
- Invite tokens: 7-day expiry, claimed at `/invite/[token]`

### Review Visibility
- During review: editor + reviewer only (researcher during rebuttal)
- After decision: anonymized comments PUBLIC. Confidential editor comments NEVER public, NEVER on-chain.
- Reviewer identity: wallet-linked, anonymous to researchers. Rebuttal does NOT expose identity.

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx / providers.client.tsx / page.tsx / globals.css
│   ├── login/ / onboarding/ / invite/[token]/
│   ├── api/  (contracts/, papers/[id]/content/, submissions/[id]/*, reviews/*, rebuttals/*, cron/deadlines, upload/ipfs)
│   └── (protected)/  (researcher/, editor/, reviewer/)
├── features/  (auth, researcher, editor, reviewer, contracts, papers, users, reviews, rebuttals, notifications)
└── shared/
    ├── components/  (TopBar, Footer, RoleShell, DashboardHeader, PdfViewer)
    ├── context/UserContext.tsx / hooks/useCurrentUser.ts
    └── lib/  (auth/, db/schema.ts, hedera/*, lit/, hashing.ts, storage.ts)
```

## Environment Variables

```
# Required
NEXT_PUBLIC_THIRDWEB_CLIENT_ID, AUTH_PRIVATE_KEY, NEXT_PUBLIC_APP_DOMAIN, DATABASE_URL

# Hedera (optional — graceful fallback)
HEDERA_NETWORK, HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY, HEDERA_EVM_PRIVATE_KEY
HCS_TOPIC_PAPERS, HCS_TOPIC_CONTRACTS, HCS_TOPIC_SUBMISSIONS, HCS_TOPIC_CRITERIA
HCS_TOPIC_REVIEWS, HCS_TOPIC_DECISIONS, HCS_TOPIC_RETRACTIONS
HTS_REPUTATION_TOKEN_ID, TIMELINE_ENFORCER_ADDRESS

# Optional
CRON_SECRET, PINATA_JWT, NEXT_PUBLIC_PINATA_GATEWAY_URL, NEXT_PUBLIC_LIT_NETWORK
```

<!-- NEXT-AGENTS-MD-START -->[Next.js Docs Index]|root: ./.next-docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: npx @next/codemod agents-md --output CLAUDE.md|01-app:{04-glossary.mdx}|01-app/01-getting-started:{01-installation.mdx,02-project-structure.mdx,03-layouts-and-pages.mdx,04-linking-and-navigating.mdx,05-server-and-client-components.mdx,06-cache-components.mdx,07-fetching-data.mdx,08-updating-data.mdx,09-caching-and-revalidating.mdx,10-error-handling.mdx,11-css.mdx,12-images.mdx,13-fonts.mdx,14-metadata-and-og-images.mdx,15-route-handlers.mdx,16-proxy.mdx,17-deploying.mdx,18-upgrading.mdx}|01-app/02-guides:{analytics.mdx,authentication.mdx,backend-for-frontend.mdx,caching.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,data-security.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,json-ld.mdx,lazy-loading.mdx,local-development.mdx,mcp.mdx,mdx.mdx,memory-usage.mdx,multi-tenant.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,prefetching.mdx,production-checklist.mdx,progressive-web-apps.mdx,public-static-pages.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,single-page-applications.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx,videos.mdx}|01-app/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|01-app/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|01-app/02-guides/upgrading:{codemods.mdx,version-14.mdx,version-15.mdx,version-16.mdx}|01-app/03-api-reference:{07-edge.mdx,08-turbopack.mdx}|01-app/03-api-reference/01-directives:{use-cache-private.mdx,use-cache-remote.mdx,use-cache.mdx,use-client.mdx,use-server.mdx}|01-app/03-api-reference/02-components:{font.mdx,form.mdx,image.mdx,link.mdx,script.mdx}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.mdx,manifest.mdx,opengraph-image.mdx,robots.mdx,sitemap.mdx}|01-app/03-api-reference/03-file-conventions:{default.mdx,dynamic-routes.mdx,error.mdx,forbidden.mdx,instrumentation-client.mdx,instrumentation.mdx,intercepting-routes.mdx,layout.mdx,loading.mdx,mdx-components.mdx,not-found.mdx,page.mdx,parallel-routes.mdx,proxy.mdx,public-folder.mdx,route-groups.mdx,route-segment-config.mdx,route.mdx,src-folder.mdx,template.mdx,unauthorized.mdx}|01-app/03-api-reference/04-functions:{after.mdx,cacheLife.mdx,cacheTag.mdx,connection.mdx,cookies.mdx,draft-mode.mdx,fetch.mdx,forbidden.mdx,generate-image-metadata.mdx,generate-metadata.mdx,generate-sitemaps.mdx,generate-static-params.mdx,generate-viewport.mdx,headers.mdx,image-response.mdx,next-request.mdx,next-response.mdx,not-found.mdx,permanentRedirect.mdx,redirect.mdx,refresh.mdx,revalidatePath.mdx,revalidateTag.mdx,unauthorized.mdx,unstable_cache.mdx,unstable_noStore.mdx,unstable_rethrow.mdx,updateTag.mdx,use-link-status.mdx,use-params.mdx,use-pathname.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,use-selected-layout-segment.mdx,use-selected-layout-segments.mdx,userAgent.mdx}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,appDir.mdx,assetPrefix.mdx,authInterrupts.mdx,basePath.mdx,browserDebugInfoInTerminal.mdx,cacheComponents.mdx,cacheHandlers.mdx,cacheLife.mdx,compress.mdx,crossOrigin.mdx,cssChunking.mdx,devIndicators.mdx,distDir.mdx,env.mdx,expireTime.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,htmlLimitedBots.mdx,httpAgentOptions.mdx,images.mdx,incrementalCacheHandlerPath.mdx,inlineCss.mdx,isolatedDevBuild.mdx,logging.mdx,mdxRs.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactCompiler.mdx,reactMaxHeadersLength.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,sassOptions.mdx,serverActions.mdx,serverComponentsHmrCache.mdx,serverExternalPackages.mdx,staleTimes.mdx,staticGeneration.mdx,taint.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,turbopackFileSystemCache.mdx,typedRoutes.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,viewTransition.mdx,webVitalsAttribution.mdx,webpack.mdx}|01-app/03-api-reference/05-config:{02-typescript.mdx,03-eslint.mdx}|01-app/03-api-reference/06-cli:{create-next-app.mdx,next.mdx}|02-pages/01-getting-started:{01-installation.mdx,02-project-structure.mdx,04-images.mdx,05-fonts.mdx,06-css.mdx,11-deploying.mdx}|02-pages/02-guides:{analytics.mdx,authentication.mdx,babel.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,lazy-loading.mdx,mdx.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,post-css.mdx,preview-mode.mdx,production-checklist.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx}|02-pages/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|02-pages/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|02-pages/02-guides/upgrading:{codemods.mdx,version-10.mdx,version-11.mdx,version-12.mdx,version-13.mdx,version-14.mdx,version-9.mdx}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.mdx,02-dynamic-routes.mdx,03-linking-and-navigating.mdx,05-custom-app.mdx,06-custom-document.mdx,07-api-routes.mdx,08-custom-error.mdx}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.mdx,02-static-site-generation.mdx,04-automatic-static-optimization.mdx,05-client-side-rendering.mdx}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.mdx,02-get-static-paths.mdx,03-forms-and-mutations.mdx,03-get-server-side-props.mdx,05-client-side.mdx}|02-pages/03-building-your-application/06-configuring:{12-error-handling.mdx}|02-pages/04-api-reference:{06-edge.mdx,08-turbopack.mdx}|02-pages/04-api-reference/01-components:{font.mdx,form.mdx,head.mdx,image-legacy.mdx,image.mdx,link.mdx,script.mdx}|02-pages/04-api-reference/02-file-conventions:{instrumentation.mdx,proxy.mdx,public-folder.mdx,src-folder.mdx}|02-pages/04-api-reference/03-functions:{get-initial-props.mdx,get-server-side-props.mdx,get-static-paths.mdx,get-static-props.mdx,next-request.mdx,next-response.mdx,use-params.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,userAgent.mdx}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,assetPrefix.mdx,basePath.mdx,bundlePagesRouterDependencies.mdx,compress.mdx,crossOrigin.mdx,devIndicators.mdx,distDir.mdx,env.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,httpAgentOptions.mdx,images.mdx,isolatedDevBuild.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,serverExternalPackages.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,webVitalsAttribution.mdx,webpack.mdx}|02-pages/04-api-reference/04-config:{01-typescript.mdx,02-eslint.mdx}|02-pages/04-api-reference/05-cli:{create-next-app.mdx,next.mdx}|03-architecture:{accessibility.mdx,fast-refresh.mdx,nextjs-compiler.mdx,supported-browsers.mdx}|04-community:{01-contribution-guide.mdx,02-rspack.mdx}<!-- NEXT-AGENTS-MD-END -->
