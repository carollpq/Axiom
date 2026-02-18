# 📄 Research Chain

**Trustless, transparent research publishing and peer review on Hedera.**

Research Chain is a blockchain-backed platform that enforces authorship contracts, transparent peer review, reviewer reputation, versioned provenance, and journal accountability — replacing promises with cryptographic proof.

---

## The Problem

Academic publishing is broken:

- **Authorship disputes** are resolved by politics, not proof.
- **Peer review** is opaque — journals make promises about fairness with no enforcement.
- **Idea theft** is hard to disprove without verifiable timestamps.
- **Reviewers** have no portable reputation and no accountability.
- **Reproducibility** is an afterthought — datasets, code, and environments are rarely locked to publications.

## The Solution

Research Chain moves the critical trust infrastructure of academic publishing onto Hedera, where commitments become cryptographically enforceable contracts — not policies that can be quietly ignored.

- **Authorship contracts** require all contributors to cryptographically sign contribution splits before submission.
- **Paper registration** timestamps research drafts on-chain, proving first disclosure.
- **Review criteria** are published on-chain before review begins — if a paper meets the criteria, the journal is bound to publish.
- **Reviewer reputation** is non-transferable, cross-journal, and append-only.
- **Full provenance** locks dataset, code, and environment hashes to every paper version.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router) |
| Blockchain | Hedera (HCS, DID) |
| Wallets | HashPack, MetaMask |
| Database | PostgreSQL (Neon) |
| File Storage | Cloudflare R2 (S3-compatible) |
| Cache | Upstash Redis |
| Deployment | Vercel |
| Identity | DID:Hedera + ORCID OAuth 2.0 |
| ORM | Drizzle ORM |

---

## Architecture Overview

```
Browser (Next.js)
├── Client-side SHA-256 hashing (Web Crypto API)
├── Wallet signing (HashPack / MetaMask)
└── Role-based dashboards (Author, Reviewer, Editor)
        │
        ▼
API Layer (Vercel Serverless)
├── Business logic & validation
├── Off-chain CRUD (PostgreSQL)
├── Hedera HCS message submission
└── Presigned upload URLs (R2)
        │
        ├──► Hedera Network (hashes, signatures, criteria, decisions)
        ├──► PostgreSQL via Neon (users, papers, contracts, reviews, reputation)
        └──► Cloudflare R2 (PDFs, datasets, environment specs)
```

**Core principle:** No paper content or PII is stored on-chain — only cryptographic hashes and metadata. Content lives off-chain; Hedera provides the immutable proof layer.

For the full architecture document, see [`docs/architecture.md`](docs/architecture.md).

---

## Pages

| # | Page | Description |
|---|---|---|
| 1 | **Landing Page** | Value proposition, CTAs for wallet connect and paper exploration |
| 2 | **Wallet Connect / Login** | HashPack/MetaMask connection, DID creation, ORCID linking, role selection |
| 3 | **Author Dashboard** | Paper management, pending actions, activity feed |
| 4 | **Authorship Contract Builder** | Define contribution splits, collect cryptographic signatures |
| 5 | **Paper Registration & Submission** | Register drafts on-chain, link provenance, submit to journals |
| 6 | **Paper View / Public Explorer** | Search/browse papers, verify on-chain proof, view version history |
| 7 | **Reviewer Dashboard** | Assigned reviews, reputation score, anonymized feedback |
| 8 | **Review Workspace** | Evaluate against on-chain criteria, submit immutable reviews |
| 9 | **Journal Dashboard** | Submission pipeline, criteria publishing, accept/reject with accountability |
| 10 | **Profile / Settings** | Identity management, role config, reviewer ratings, notifications |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- A Hedera testnet account ([portal.hedera.com](https://portal.hedera.com))
- HashPack or MetaMask browser extension
- An ORCID account ([orcid.org](https://orcid.org))

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Hedera
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e...

# Database (Neon)
DATABASE_URL=postgresql://user:pass@host/dbname

# File Storage (Cloudflare R2)
S3_BUCKET=research-chain-files
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_ENDPOINT=https://your-account.r2.cloudflarestorage.com

# ORCID OAuth
ORCID_CLIENT_ID=APP-XXXXXXXXX
ORCID_CLIENT_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ORCID_REDIRECT_URI=http://localhost:3000/api/auth/orcid/callback

# GitHub OAuth (for repo linking)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Auth
JWT_SECRET=your-secret-key-min-32-chars

# Cache (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/research-chain.git
cd research-chain

# Install dependencies
pnpm install

# Set up the database
pnpm db:generate   # Generate Drizzle migrations
pnpm db:migrate    # Run migrations

# Initialize Hedera HCS topics (one-time setup)
pnpm hedera:init-topics

# Start the development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Hedera Topic Initialization

The `hedera:init-topics` script creates the required HCS topics and outputs their IDs. Add these to your `.env.local`:

```env
HCS_TOPIC_PAPERS=0.0.xxxxx
HCS_TOPIC_CONTRACTS=0.0.xxxxx
HCS_TOPIC_SUBMISSIONS=0.0.xxxxx
HCS_TOPIC_CRITERIA=0.0.xxxxx
HCS_TOPIC_REVIEWS=0.0.xxxxx
HCS_TOPIC_DECISIONS=0.0.xxxxx
HCS_TOPIC_RETRACTIONS=0.0.xxxxx
```

---

## Project Structure

```
research-chain/
├── app/
│   ├── (public)/              # Landing page, public explorer
│   ├── (auth)/                # Wallet connect / login
│   ├── (dashboard)/           # Role-based dashboards
│   │   ├── author/            # Author dashboard, contracts, papers
│   │   ├── reviewer/          # Reviewer dashboard, review workspace
│   │   ├── editor/            # Journal dashboard
│   │   └── settings/          # Profile & settings
│   └── api/                   # Route handlers
│       ├── auth/
│       ├── papers/
│       ├── contracts/
│       ├── reviews/
│       ├── journals/
│       ├── hedera/
│       └── cron/
├── components/
│   ├── wallet/                # Wallet connection UI
│   ├── identity/              # DID, ORCID components
│   ├── hedera/                # Transaction links, hash display
│   ├── paper/                 # Paper cards, provenance, versions
│   ├── contract/              # Contributor table, signatures
│   ├── review/                # Criteria checklist, review form
│   ├── dashboard/             # Shared dashboard shell
│   └── ui/                    # Generic UI primitives
├── lib/
│   ├── hedera/                # Hedera SDK integration
│   │   ├── client.ts
│   │   ├── hcs.ts
│   │   ├── did.ts
│   │   └── verify.ts
│   ├── wallet/                # Wallet adapter abstraction
│   ├── hashing.ts             # Client-side SHA-256 utilities
│   ├── db/                    # Drizzle schema & queries
│   ├── storage.ts             # S3/R2 presigned URL generation
│   └── auth.ts                # JWT utilities
├── providers/                 # React context providers
│   ├── WalletProvider.tsx
│   ├── AuthProvider.tsx
│   └── RoleProvider.tsx
├── docs/
│   └── architecture.md        # Full architecture document
├── scripts/
│   └── init-topics.ts         # HCS topic initialization
├── drizzle.config.ts
├── next.config.ts
└── vercel.json                # Cron job definitions
```

---

## Key Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm db:generate` | Generate Drizzle migrations from schema |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Drizzle Studio (DB browser) |
| `pnpm hedera:init-topics` | Create HCS topics on Hedera testnet |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run test suite |

---

## Deployment

The application is designed for Vercel deployment:

```bash
# Install Vercel CLI
pnpm i -g vercel

# Deploy
vercel --prod
```

**Required Vercel configuration:**

1. Add all environment variables from `.env.local` to your Vercel project settings.
2. Ensure `vercel.json` includes cron job definitions for reputation recomputation and deadline monitoring.
3. Set the Node.js version to 18+ in project settings.

**Production checklist:**

- [ ] Switch `HEDERA_NETWORK` to `mainnet`
- [ ] Update HCS topic IDs to mainnet topics
- [ ] Configure R2/S3 bucket with appropriate CORS policy
- [ ] Set up Neon production database with connection pooling
- [ ] Enable Vercel Analytics and Speed Insights
- [ ] Configure ORCID production credentials (vs sandbox)
- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Review and set Hedera operator account HBAR budget alerts

---

## Why Hedera?

| Concern | Hedera Advantage |
|---|---|
| Finality | Transactions finalize in 3–5 seconds (vs minutes/hours on Ethereum) |
| Cost | HCS messages cost fractions of a cent (vs $1–50+ gas on Ethereum) |
| Governance | Enterprise-grade governing council (vs anonymous validator sets) |
| UX | Fast, predictable fees enable smooth user experience |
| Sustainability | Carbon-negative network |

---

## MVP Scope

### Included

- ✅ Authorship contribution contracts (FR-1)
- ✅ Paper registration & timestamped ownership (FR-2)
- ✅ Immutable versioning & provenance (FR-3)
- ✅ Pre-registered peer review contracts (FR-4)
- ✅ Reviewer reputation system (FR-5.1–5.4)
- ✅ Reviewer feedback transparency (FR-6)
- ✅ Retraction display (FR-7, read-only)

### Post-MVP (v2+)

- Sybil-resistant reviewer identity (FR-5.5)
- Retraction management (FR-7, write)
- Funding-linked review timelines (FR-8)
- Scientific fraud insurance markets (FR-9)
- Commercial IP tagging (FR-10)
- AI-generated review detection (FR-11)

---

## Contributing

Contributions are welcome. Please read the [contributing guide](CONTRIBUTING.md) before submitting a PR.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

[MIT](LICENSE)
