# Research Chain

**Trustless, transparent research publishing and peer review on Hedera.**

Research Chain is a blockchain-backed platform that enforces authorship contracts, transparent peer review, reviewer reputation, versioned provenance, and journal accountability — replacing promises with cryptographic proof.

---

## The Problem

Academic publishing is broken:

- **Authorship disputes** are resolved by politics, not proof.
- **Peer review** is opaque — journals make promises about fairness with no enforcement.
- **Idea theft** is hard to disprove without verifiable timestamps.
- **Reviewers** have no portable reputation and no accountability.
- **Authors and reviewers earn nothing** — journals capture ~95% of the value while creators get $0.
- **Reproducibility** is an afterthought — datasets, code, and environments are rarely locked to publications.

## The Solution

Research Chain moves the critical trust infrastructure of academic publishing onto Hedera, where commitments become cryptographically enforceable contracts — not policies that can be quietly ignored.

- **Authorship contracts** require all contributors to cryptographically sign contribution splits before submission.
- **Paper registration** timestamps research drafts on-chain, proving first disclosure.
- **Review criteria** are published on-chain before review begins — if a paper meets the criteria, the journal is bound to publish.
- **Reviewer reputation** is non-transferable, cross-journal, and append-only — represented as soulbound HTS tokens owned by the reviewer, not any journal.
- **Full provenance** locks dataset, code, and environment hashes to every paper version.
- **x402 micropayments** auto-split revenue to authors (70%), reviewers (15%), journals (10%), and the platform (5%) — creators get paid, not just publishers.
- **Decentralized access control** via Lit Protocol enforces paper privacy cryptographically, not by trusting the server.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router, Turbopack) |
| Blockchain | Hedera (HCS, HTS, DID, Smart Contracts) |
| Payments | x402 Protocol (micropayments, revenue splitting) |
| Access Control | Lit Protocol (threshold encryption) |
| Wallets | HashPack, MetaMask (via Thirdweb v5) |
| Smart Contracts | Solidity on Hedera EVM (Hardhat) |
| Database | PostgreSQL (Neon) |
| File Storage | Cloudflare R2 (S3-compatible) |
| Cache | Upstash Redis |
| Deployment | Vercel |
| Identity | DID:Hedera + ORCID OAuth 2.0 |
| ORM | Drizzle ORM |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                       BROWSER CLIENT                          │
│  Next.js App · Wallet SDKs · Client-side Hashing              │
│  Lit SDK (encrypt/decrypt) · x402 Client (pay for access)     │
└───────┬──────────────────────┬───────────────┬───────────────┘
        │ HTTPS (API Routes)   │ Wallet Signing │ Lit Network
        ▼                      ▼               ▼
┌────────────────────┐  ┌──────────────┐  ┌──────────────────┐
│  NEXT.JS API LAYER │  │    HEDERA     │  │  LIT PROTOCOL    │
│  (Vercel Serverless)│  │   NETWORK    │  │   NETWORK        │
│                    │  │              │  │                  │
│  Business Logic    │  │  HCS Topics  │  │  Threshold MPC   │
│  x402 Middleware   │  │  HTS Tokens  │  │  Access Control   │
│  Off-chain CRUD    │  │  DID Service │  │  Encrypt/Decrypt  │
│  Revenue Splitting │  │  Smart       │  │                  │
│                    │  │  Contracts   │  │                  │
└────────┬───────────┘  └──────────────┘  └──────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                   OFF-CHAIN DATA LAYER                         │
│  PostgreSQL (structured) · Cloudflare R2 (encrypted files)     │
│  Upstash Redis (cache, rate limiting)                          │
└──────────────────────────────────────────────────────────────┘
```

**Core principle:** No paper content or PII is stored on-chain — only cryptographic hashes and metadata. Content lives off-chain (Lit-encrypted on R2); Hedera provides the immutable proof layer.

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
| 11 | **Earnings Dashboard** | Revenue tracking, x402 micropayment history, per-paper earnings breakdown |
| 12 | **External Paper Verification Tool** | Standalone hash verification — verify any paper's on-chain proof without login |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Hedera testnet account ([portal.hedera.com](https://portal.hedera.com))
- HashPack or MetaMask browser extension
- An ORCID account ([orcid.org](https://orcid.org))

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Thirdweb (wallet provider)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# Hedera
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e...

# HCS Topics
HCS_TOPIC_PAPERS=0.0.xxxxx
HCS_TOPIC_CONTRACTS=0.0.xxxxx
HCS_TOPIC_SUBMISSIONS=0.0.xxxxx
HCS_TOPIC_CRITERIA=0.0.xxxxx
HCS_TOPIC_REVIEWS=0.0.xxxxx
HCS_TOPIC_DECISIONS=0.0.xxxxx
HCS_TOPIC_RETRACTIONS=0.0.xxxxx
HCS_TOPIC_EARNINGS=0.0.xxxxx

# HTS (Soulbound Reputation Tokens)
HTS_REPUTATION_TOKEN_ID=0.0.xxxxx

# Smart Contracts (Hedera EVM)
REVENUE_SPLITTER_CONTRACT_ADDRESS=0x...
PAYMENT_RECEIPT_CONTRACT_ADDRESS=0x...

# x402 Micropayments
X402_FACILITATOR_URL=https://x402-facilitator.example.com

# Lit Protocol
LIT_NETWORK=cayenne

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
npm install

# Start the development server (frontend prototype — no backend required)
npm run dev
```

The app will be available at `http://localhost:3000`.

> **Note:** The codebase is currently a frontend prototype with hardcoded mock data. Backend setup (database, Hedera topics, smart contracts) is not yet required.

### Backend Setup (when implemented)

```bash
# Set up the database
npm run db:generate   # Generate Drizzle migrations
npm run db:migrate    # Run migrations

# Initialize Hedera HCS topics (one-time setup)
npm run hedera:init-topics

# Deploy smart contracts to Hedera testnet
npx hardhat deploy --network hedera-testnet
```

---

## Project Structure

```
research-chain/
├── app/
│   ├── layout.tsx                 # Root layout (ThirdwebProvider, global styles)
│   ├── page.tsx                   # Landing page
│   ├── globals.css                # Tailwind v4 import + global styles
│   ├── (author)/                  # Author role pages
│   │   ├── layout.tsx             # Shared shell: TopBar + Footer
│   │   ├── page.tsx               # Author dashboard
│   │   ├── contract_builder/      # Authorship contract builder
│   │   ├── paper_registration/    # Paper registration wizard (4 steps)
│   │   └── public_explorer/       # Public paper explorer + detail view
│   ├── (journal)/                 # Journal/editor pages
│   │   ├── layout.tsx             # Shared journal shell
│   │   └── journal/               # Journal dashboard
│   └── (reviewer)/                # Reviewer pages
│       ├── layout.tsx             # Shared reviewer shell
│       ├── reviewer/              # Reviewer dashboard
│       └── review_workspace/      # Review workspace
├── components/
│   ├── author-dashboard/          # Author dashboard components
│   ├── contract/                  # Contract builder components
│   ├── explorer/                  # Paper explorer + detail components
│   ├── journal-dashboard/         # Journal dashboard components
│   ├── reviewer-dashboard/        # Reviewer dashboard components
│   ├── review-workspace/          # Review workspace components
│   ├── paper-registration/        # Paper registration wizard components
│   ├── onboarding/                # Onboarding flow components
│   └── shared/                    # Shared UI components (TopBar, Footer, RoleShell)
├── hooks/                         # Domain-specific state management hooks
├── types/                         # TypeScript interfaces per domain
├── lib/
│   ├── mock-data/                 # Hardcoded mock data (typed exports)
│   ├── thirdweb.ts                # Thirdweb SDK configuration
│   └── validation.ts              # Validation utilities
├── docs/
│   └── architecture.md            # Full architecture document (v2)
├── next.config.ts
└── tsconfig.json
```

### Planned directories (when backend is implemented)

```
lib/
├── hedera/                        # Hedera SDK integration (client, HCS, DID, verify)
├── wallet/                        # Wallet adapter abstraction
├── x402/                          # x402 middleware, facilitator client, payment config
├── lit/                           # Lit Protocol encryption/decryption, access conditions
├── hashing.ts                     # Client-side SHA-256 utilities
├── db/                            # Drizzle schema & queries
├── storage.ts                     # S3/R2 presigned URL generation
└── auth.ts                        # JWT utilities

contracts/                         # Solidity smart contracts (Hardhat)
├── PaperRevenueSplitter.sol       # x402 revenue distribution
└── PaymentReceiptRegistry.sol     # On-chain payment receipts for Lit access
```

---

## Key Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Production build (requires `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`) |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npx tsc --noEmit` | Type-check without building |

### Planned scripts (when backend is implemented)

| Command | Description |
|---|---|
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |
| `npm run hedera:init-topics` | Create HCS topics on Hedera testnet |
| `npm test` | Run test suite |

---

## Deployment

The application is designed for Vercel deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Required Vercel configuration:**

1. Add all environment variables from `.env.local` to your Vercel project settings.
2. Ensure `vercel.json` includes cron job definitions for reputation recomputation, deadline monitoring, and earnings aggregation.
3. Set the Node.js version to 18+ in project settings.

**Production checklist:**

- [ ] Switch `HEDERA_NETWORK` to `mainnet`
- [ ] Update HCS topic IDs to mainnet topics
- [ ] Deploy smart contracts to Hedera mainnet
- [ ] Configure R2/S3 bucket with appropriate CORS policy
- [ ] Set up Neon production database with connection pooling
- [ ] Configure Lit Protocol for production network
- [ ] Set up x402 facilitator (self-hosted or production instance)
- [ ] Enable Vercel Analytics and Speed Insights
- [ ] Configure ORCID production credentials (vs sandbox)
- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Review and set Hedera operator account HBAR budget alerts

---

## Why Hedera?

| Concern | Hedera Advantage |
|---|---|
| Finality | Transactions finalize in 3-5 seconds (vs minutes/hours on Ethereum) |
| Cost | HCS messages cost fractions of a cent (vs $1-50+ gas on Ethereum) |
| EVM Compatibility | Solidity smart contracts run on Hedera EVM with access to native HTS via System Contracts |
| Governance | Enterprise-grade governing council (vs anonymous validator sets) |
| UX | Fast, predictable fees enable smooth user experience |
| Sustainability | Carbon-negative network |

---

## MVP Scope

### Included

- Authorship contribution contracts (FR-1)
- Paper registration & timestamped ownership (FR-2)
- Immutable versioning & provenance (FR-3)
- Pre-registered peer review contracts (FR-4)
- Reviewer reputation system (FR-5.1-5.4)
- Reviewer feedback transparency (FR-6)
- Retraction display (FR-7, read-only)

### Hackathon Additions (v2)

- **x402 micropayments** — authors and reviewers earn revenue from paper access (70/15/10/5 split)
- **HTS soulbound reputation tokens** — portable, non-transferable, journal-independent reviewer reputation on-chain
- **Lit Protocol access control** — decentralized encryption for paper privacy (draft, review, paid, retracted states)
- **Revenue splitter smart contract** — Solidity contract on Hedera EVM for automatic payment distribution
- **Payment receipt registry** — on-chain proof of payment for Lit decryption access
- **Earnings dashboard** — track per-paper revenue, payment history, and cumulative earnings
- **External verification tool** — standalone hash verification for any paper's on-chain proof
- **Negative result / replication study tagging** — `study_type` field to surface null results and replications

### Post-MVP (v3+)

- Sybil-resistant reviewer identity (FR-5.5)
- Retraction management (FR-7, write)
- Funding-linked review timelines (FR-8)
- Funder-subsidized open access (escrow smart contracts)
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
