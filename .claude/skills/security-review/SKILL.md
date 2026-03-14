---
name: security-review
description: "Deep security audit of changed files or a PR. Checks for injection, auth bypass, XSS, SSRF, secrets in code, and more — organized by severity."
metadata:
  author: axiom
  version: "1.0.0"
  argument-hint: <PR-number|branch|file-path>
---

# Security Review — Dedicated Security Audit

Run a focused security audit on a PR, branch diff, or specific files. Findings are severity-ranked with concrete attack vectors and actionable fixes.

## Usage

```
/security-review 42              # Review PR #42
/security-review feature/auth    # Review branch diff against main
/security-review src/app/api/    # Review specific directory
/security-review                 # Auto-detect: current branch PR or staged changes
```

## Step 1: Resolve Scope

Determine what to review based on the argument:

**If a PR number is given:**

```bash
gh pr view {number} --json number,title,url,headRefName,body,files,baseRefName
gh pr diff {number}
```

**If a branch name is given:**

```bash
gh pr list --head {branch} --json number,title,url,headRefName,body,files,baseRefName --limit 1
```

If a PR exists, fetch its diff. Otherwise:

```bash
git diff main...{branch}
```

**If a file or directory path is given:**

Read the files directly. No diff — audit the current state of the code.

**If no argument is given (auto-detect):**

```bash
git branch --show-current
```

Then try to find a PR for that branch. If no PR, use `git diff main...HEAD`. If no diff, use `git diff --staged`. If nothing staged, tell the user and stop.

Present the scope for confirmation:

```
Security Review Scope:
- PR #42: feat: Add reviewer assignment endpoint
- Files: 8 changed
- Branch: feature/assign-reviewer -> main

Proceed? (yes / no)
```

Wait for user confirmation.

## Step 2: Understand the Security Context

Before reviewing the diff, build context by reading:

1. **`CLAUDE.md`** — understand the auth model, API patterns, and security conventions
2. **Auth middleware** — how sessions work, how wallet identity is verified (`getSession()`, JWT cookies)
3. **Existing validation patterns** — how input is validated in similar routes (Zod schemas, drizzle-zod)
4. **Database access patterns** — how queries are constructed (Drizzle ORM parameterisation)
5. **Environment variable handling** — what's in `.env.example` or documented, vs what's in code

Use Grep and Glob to find relevant patterns in the codebase. Read full files for any changed API routes or middleware.

## Step 3: Audit Against Security Checklist

Review every changed file against the checklist in [security-checklist.md](references/security-checklist.md).

For each finding:
1. Identify the **exact file and line(s)**
2. Describe the **vulnerability** in plain language
3. Explain a **concrete attack scenario** (how would an attacker exploit this?)
4. Provide an **actionable fix** (code snippet or specific change)
5. Assign a **severity** (CRITICAL / HIGH / MEDIUM / LOW)

### Audit Focus Areas

For **API routes** (`src/app/api/`):
- Is `getSession()` called and the wallet used (not trusting request body)?
- Is input validated with Zod before use?
- Are database queries parameterised (Drizzle ORM, not raw SQL)?
- Does the route check that the authenticated user owns/has access to the resource?
- Are error responses generic (no stack traces, no internal details)?
- Is `runtime = 'nodejs'` set if using Hedera SDK?

For **client components**:
- Is user input sanitized before rendering (no `dangerouslySetInnerHTML` with user data)?
- Are URLs validated before use in redirects or fetches?
- Is sensitive data kept out of client-side state?

For **database operations**:
- Are all queries using Drizzle's query builder (parameterised by default)?
- Is row-level access control enforced (user can only access their own data)?
- Are sensitive fields excluded from query results where not needed?

For **cryptographic operations**:
- Is `canonicalJson()` used before hashing (not raw `JSON.stringify()`)?
- Are secrets loaded from environment variables, never hardcoded?
- Is the hashing algorithm appropriate (SHA-256 minimum)?

For **dependencies and config**:
- Are new dependencies from trusted sources?
- Are there known CVEs in added packages?
- Is anything sensitive committed that should be in `.gitignore`?

## Step 4: Present Findings

### 4a. Summary

```
## Security Audit: {scope description}

**Risk Level: CLEAR / LOW RISK / MEDIUM RISK / HIGH RISK / CRITICAL RISK**

Findings: CRITICAL: X | HIGH: X | MEDIUM: X | LOW: X
```

- **CLEAR**: No findings. Code follows established security patterns.
- **LOW RISK**: Only LOW findings. Defence-in-depth suggestions.
- **MEDIUM RISK**: MEDIUM findings present. Should be addressed before merge.
- **HIGH RISK**: HIGH findings. Fix before merge.
- **CRITICAL RISK**: CRITICAL findings. Must fix immediately. Do not merge.

### 4b. Findings Table

```
| # | Severity | File:Line | Vulnerability | Attack Scenario | Fix |
|---|----------|-----------|---------------|-----------------|-----|
| 1 | CRITICAL | src/app/api/papers/[id]/route.ts:28 | Missing auth check | Unauthenticated user can read any paper by ID | Add getSession() guard |
| 2 | HIGH | src/app/api/reviews/[id]/route.ts:45 | IDOR: no ownership check | Reviewer A can modify Reviewer B's review | Verify assignment belongs to session wallet |
```

### 4c. Detailed Findings

For each CRITICAL and HIGH finding, provide a detailed breakdown:

```
### Finding #1: Missing Authentication Check [CRITICAL]

**File:** `src/app/api/papers/[id]/route.ts:28`

**Vulnerability:** The GET handler does not call `getSession()`, allowing unauthenticated
access to paper data including private drafts.

**Attack scenario:** An attacker can enumerate paper IDs and retrieve any paper's metadata
and content without authentication.

**Current code:**
\`\`\`ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const paper = await getPaperById(params.id);
  return NextResponse.json(paper);
}
\`\`\`

**Fix:**
\`\`\`ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const paper = await getPaperById(params.id);
  // Also verify the user has access to this paper
  return NextResponse.json(paper);
}
\`\`\`
```

### 4d. Positive Observations

Note security patterns that are done well — this reinforces good practices:

```
### Well Done
- All mutation routes use `getSession()` and verify wallet ownership
- Drizzle ORM used throughout — no raw SQL injection surface
- Secrets loaded from environment variables, not committed
```

## Step 5: Offer to Fix

For CRITICAL and HIGH findings, ask:

```
Fix CRITICAL and HIGH findings now? (yes / no / pick specific findings)
```

If yes, apply the fixes directly. For each fix:
1. Read the full file
2. Apply the minimal change needed
3. Verify the fix doesn't break the existing logic

## Step 6: Post to PR (if applicable)

If reviewing a PR, ask:

```
Post security findings to PR #{number}? (yes / no)
```

If yes, use `gh pr review` to post CRITICAL and HIGH findings as review comments. Do NOT post MEDIUM or LOW to avoid noise.

**Always wait for user approval before posting.**

## Key Principles

- **Concrete over theoretical** — every finding must have a plausible attack scenario, not just "this could be bad"
- **Actionable fixes** — every finding includes a specific fix, not just a warning
- **No false positives** — only report findings you can explain with a concrete risk. If unsure, don't flag it.
- **Context-aware** — understand the project's auth model and patterns before flagging deviations
- **Severity is meaningful** — CRITICAL means "exploitable now with real impact". Don't inflate severity.
- **Security only** — do NOT comment on code style, performance, or patterns. Stay in your lane.
- **Read before judging** — always read the full file, not just the diff. The fix might already exist nearby.
