# Axiom

**Trustless, transparent academic publishing and peer review on Hedera.**

Axiom is a blockchain-backed platform that makes peer review fair, transparent, and accountable — without disrupting journal revenue models. Journals publish review criteria on-chain, reviewers build portable soulbound reputation, authors get real-time updates and the right to rebut unfair reviews, and all commitments are cryptographically enforced.

**Hackathon:** Hedera Hello Future: Apex 2026

---

## The Problem

Academic publishing is broken:

- **Peer review** is opaque — journals make promises about fairness with no enforcement.
- **Reviewers** have no portable reputation and no accountability for vague or unfair reviews.
- **Authorship disputes** are resolved by politics, not proof.
- **Idea theft** is hard to disprove without verifiable timestamps.
- **Authors** have no recourse against unfair rejections — no rebuttal mechanism, no transparency.
- **Reproducibility** is an afterthought — datasets, code, and environments are rarely locked to publications.

## The Solution

Axiom moves the critical trust infrastructure of academic publishing onto Hedera, where commitments become cryptographically enforceable — not policies that can be quietly ignored.

### Key Differentiators

1. **Structured reviewer feedback** — Reviews are broken into per-criterion evaluations (yes/no/partially + required comment). Vague rejections are no longer possible.
2. **Soulbound reviewer reputation** — HTS NFTs minted per review event. Portable, non-transferable, cross-journal. Reviewers build a verifiable quality record.
3. **Pre-registered review criteria** — Journals publish criteria on HCS before review begins. Criteria become immutable. Rejections must be justifiable against stated criteria.
4. **Rebuttal phase** — Authors can challenge specific reviewer comments. Upheld rebuttals create negative reputation events for reviewers.
5. **Enforced timelines** — Deadlines tracked with on-chain anchoring. Late reviews = negative reputation tokens.
6. **Transparent post-decision reviews** — After final decision, anonymized review comments become public.
7. **Authorship contracts** — All contributors cryptographically sign contribution splits before submission.
8. **Paper registration** — Research drafts timestamped on-chain, proving first disclosure.

**What we do NOT change:** Journal revenue models, paywalls, subscriptions, or APCs. Journals gain tools without losing revenue.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), React 19.2 |
| Styling | Tailwind CSS v4 |
| Blockchain | Hedera (HCS for anchoring, HTS for reputation tokens) |
| Wallets | Thirdweb v5 (MetaMask, HashPack) |
| Access Control | Lit Protocol (threshold encryption) |
| Database | Neon PostgreSQL / Drizzle ORM |
| File Storage | IPFS via web3.storage (Filecoin archival) |
| PDF Viewing | react-pdf v10 / pdfjs-dist v5 |
| Deployment | Vercel |
| Identity | ORCID verification |
| Performance | Suspense streaming, `after()` non-blocking side effects, dynamic imports |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                       BROWSER CLIENT                          │
│  Next.js 16 App · Wallet SDKs · Client-side Hashing           │
│  Lit SDK (dynamically imported) · PDF Viewer                  │
└───────┬──────────────────────┬───────────────┬───────────────┘
        │ HTTPS (API Routes)   │ Wallet Signing │ Lit Network
        ▼                      ▼               ▼
┌────────────────────┐  ┌──────────────┐  ┌──────────────────┐
│  NEXT.JS API LAYER │  │    HEDERA     │  │  LIT PROTOCOL    │
│  (Vercel Serverless)│  │   NETWORK    │  │   NETWORK        │
│                    │  │              │  │                  │
│  Business Logic    │  │  HCS Topics  │  │  Threshold MPC   │
│  Review Pipeline   │  │  HTS Tokens  │  │  Access Control   │
│  Reputation System │  │  (Soulbound) │  │  Encrypt/Decrypt  │
│  Cron Jobs         │  │              │  │                  │
└────────┬───────────┘  └──────────────┘  └──────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                   OFF-CHAIN DATA LAYER                         │
│  Neon PostgreSQL (structured) · IPFS/Filecoin (encrypted files)│
└──────────────────────────────────────────────────────────────┘
```

**Core principle:** No paper content or PII is stored on-chain — only cryptographic hashes and metadata. Content lives off-chain (Lit-encrypted on IPFS); Hedera provides the immutable proof layer.

For the full architecture document, see [`docs/architecture.md`](docs/architecture.md).

---

## Features

### Researcher
- **Dashboard** — Stats overview (new submissions, under review, pending, accepted, rejected) + submission carousel + papers table + pending actions list + quick action buttons
- **Paper registration** — 4-step wizard: paper details (title, abstract, file, visibility, study type, keywords) → provenance (dataset hash, code repo, commit, env spec) → contract linking → register/submit confirmation. Client-side SHA-256 hash → IPFS upload → Lit encryption → HCS anchor.
- **Authorship contracts** — Three-tab interface: build new contracts (define contribution splits, invite collaborators), sign pending contracts, view contract status. Backend validates all signatures before submission.
- **Paper version control** — View version history per paper, upload new versions, download existing versions
- **Create submission** — Select paper version, journal, and authorship contract to submit for review
- **View submissions** — Track submissions through the review pipeline with reviewer assignment status, anonymized review feedback, and editor decisions
- **Co-author visibility** — Co-authors on authorship contracts see papers on their dashboard automatically
- **Review response** — View anonymized reviews, rate each reviewer on 5 quality protocols (actionable feedback, deep engagement, fair/objective, justified recommendation, appropriate expertise), and accept reviews or request rebuttal
- **Rebuttal workspace** — Challenge specific reviewer comments (agree/disagree + justification per review). Researcher-initiated — authors decide when to invoke rebuttal.
- **Public explorer** — Search/filter/sort public papers in grid view, detail view with tabs (overview, provenance, versions, reviews), Lit decrypt for private papers
- **Notifications** — Real-time updates at every pipeline stage (including "Viewed by Editor" status)

### Editor
- **Dashboard** — Stats overview (submissions by status) + recent submission carousel. Fully DB-backed.
- **Incoming papers** — Three-column layout (paper list → PDF viewer → contextual sidebar). Sidebar panels: criteria builder, reviewer assignment with reputation scores, desk reject. Auto-triggers "viewed by editor" status on selection.
- **Under review** — Three-column layout. Sidebar panels: review status tracking, final decision (accept/reject/revise with `allCriteriaMet` computation), rebuttal resolution, additional reviewer assignment. Shows author response status (accepted / rebuttal requested).
- **Accepted papers** — Three-column layout. Sidebar panels: review comments display, add-to-issue for journal issue management.
- **Journal management** — Update aims/scope and submission criteria, create/delete journal issues, assign papers to issues, manage reviewer pool (add/remove reviewers with search/filter).
- **Criteria builder** — Publish structured review criteria (immutable on HCS). Integrated as sidebar panel in incoming papers view.
- **Reviewer assignment** — Assign from reviewer pool with reputation scores. Minimum 2 reviewers must accept before submission transitions to "under review".
- **Decision flow** — Accept/reject with `allCriteriaMet` computation. Rejection with criteria met requires public justification.
- **Rebuttal management** — Review author responses per-review, resolve with reputation impact (upheld/rejected/partial → HTS tokens minted)

### Reviewer
- **Dashboard** — Assigned reviews, deadlines, reputation score breakdown with 5-protocol feedback display
- **Assignment acceptance** — Accept or decline review assignments via API
- **Review workspace** — Evaluate paper against published criteria with structured feedback
- **Reputation** — Soulbound HTS tokens tracking review quality across journals with 5-dimensional quality data

### Public
- **`/verify`** — Upload any PDF, client-side hash, verify against on-chain registration
- **Review transparency** — After final decision, anonymized reviews become publicly visible

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Hedera testnet account ([portal.hedera.com](https://portal.hedera.com))
- MetaMask or HashPack browser extension

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Auth (required)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
AUTH_PRIVATE_KEY=your-auth-private-key
NEXT_PUBLIC_APP_DOMAIN=localhost:3000

# Database (required)
DATABASE_URL=postgresql://user:pass@host/dbname

# Hedera (optional — graceful fallback)
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e...

# HCS Topics (optional — graceful fallback)
HCS_TOPIC_PAPERS=0.0.xxxxx
HCS_TOPIC_CONTRACTS=0.0.xxxxx
HCS_TOPIC_SUBMISSIONS=0.0.xxxxx
HCS_TOPIC_CRITERIA=0.0.xxxxx
HCS_TOPIC_REVIEWS=0.0.xxxxx
HCS_TOPIC_DECISIONS=0.0.xxxxx

# HTS (optional — graceful fallback)
HTS_REPUTATION_TOKEN_ID=0.0.xxxxx

# Cron (optional)
CRON_SECRET=your-cron-secret

# IPFS / web3.storage (optional — graceful fallback)
W3_PRINCIPAL_KEY=your_ed25519_principal_key
W3_DELEGATION_PROOF=base64_encoded_delegation_proof

# Lit Protocol (optional — graceful fallback)
NEXT_PUBLIC_LIT_NETWORK=cayenne
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/axiom.git
cd axiom

# Install dependencies
npm install

# Push DB schema (dev)
npx drizzle-kit push

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Key Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Production build |
| `npx tsc --noEmit` | Type-check without building |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npx drizzle-kit push` | Push schema to database (dev) |
| `npx drizzle-kit generate` | Generate migration files (prod) |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout (imports providers.client.tsx)
│   ├── providers.client.tsx        # Client boundary: ThirdwebProvider + UserProvider
│   ├── page.tsx                    # Landing page
│   ├── login/                      # Multi-step auth flow
│   ├── verify/                     # Public hash verification
│   ├── api/
│   │   ├── auth/                   # Authentication endpoints
│   │   ├── papers/                 # Paper CRUD + submit + reviews
│   │   ├── contracts/              # Authorship contract CRUD + signing
│   │   ├── submissions/[id]/       # criteria + assign-reviewer + accept-assignment + view + author-response + decision
│   │   ├── reviews/[id]/           # Review submission + rating
│   │   ├── rebuttals/[rebuttalId]/ # Respond + resolve
│   │   ├── notifications/          # List + mark read
│   │   ├── cron/deadlines/         # Deadline enforcement
│   │   └── verify/                 # Hash verification
│   └── (protected)/
│       ├── researcher/             # Dashboard, authorship-contracts, create-submission, view-submissions, paper-version-control (includes paper registration), rebuttal/[submissionId], review-response/[submissionId]
│       ├── editor/                 # Dashboard, incoming, under-review, accepted, management (all DB-backed, three-column layouts)
│       └── reviewer/               # Reviewer dashboard + workspace
├── features/
│   ├── researcher/                 # Researcher UI (components, hooks, reducers, config, constants, mappers, queries, types, nav)
│   ├── editor/                     # Editor UI (components, hooks, queries, actions, mappers, sidebar panels)
│   ├── reviewer/                   # Reviewer UI (components, hooks, reducers)
│   ├── reviews/                    # Review DB queries + actions
│   ├── rebuttals/                  # Rebuttal DB + hooks + components
│   ├── notifications/              # Notification DB + NotificationBell
│   ├── verify/                     # VerifyClient component
│   ├── contracts/                  # Contract DB queries + actions
│   ├── papers/                     # Paper DB queries + actions
│   └── users/                      # User DB queries
└── shared/
    ├── components/                 # Shared UI (TopBar, RoleShell, DashboardHeader, PdfViewer)
    ├── context/                    # UserContext (wallet + session)
    └── lib/
        ├── auth/                   # JWT utilities
        ├── db/schema.ts            # Drizzle schema (16 tables)
        ├── hedera/                 # HCS + HTS integration
        ├── lit/                    # Lit Protocol encryption
        ├── hashing.ts              # SHA-256 + canonical JSON
        └── storage.ts              # IPFS upload/fetch (web3.storage)
```

---

## Deployment

Designed for Vercel deployment:

```bash
vercel --prod
```

**Configuration:**
1. Add all environment variables to Vercel project settings
2. `vercel.json` includes cron job for deadline enforcement (every 6 hours)
3. Node.js 18+ required

---

## Why Hedera?

| Concern | Hedera Advantage |
|---|---|
| Finality | Transactions finalize in 3-5 seconds |
| Cost | HCS messages cost fractions of a cent |
| EVM Compatibility | Solidity smart contracts + native HTS via System Contracts |
| Governance | Enterprise-grade governing council |
| Sustainability | Carbon-negative network |

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

[MIT](LICENSE)
