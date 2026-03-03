---
name: review-task
description: "Spawn 4 parallel review agents to review a PR before submission. Reviews from 4 perspectives: security, tech debt, internal patterns, and improvements."
---

# PR Self-Review — Parallel Agent Orchestration

Review a single PR before submission using 4 parallel review agents. Designed for the developer who created the PR — catches issues before human reviewers see them.

## Usage

Invoke with a PR number, branch name, or nothing (auto-detect):

```
/review-task 352
/review-task feature/raw-emar-codes
/review-task                        # auto-detects from current branch
```

## Step 1: Resolve PR

Determine the PR to review based on the argument:

**If a PR number is given:**

```bash
gh pr view {number} --json number,title,url,headRefName,body,files,baseRefName
```

**If a branch name is given:**

```bash
gh pr list --head {branch} --json number,title,url,headRefName,body,files,baseRefName --limit 1
```

**If no argument is given (auto-detect):**

```bash
git branch --show-current
```

Then:

```bash
gh pr list --head {current_branch} --json number,title,url,headRefName,body,files,baseRefName --limit 1
```

If no PR is found, tell the user and stop.

Present the PR details for confirmation:

```
PR #352: feat: [Title here]
Branch: feature-branch → main
Files changed: 5
URL: https://github.com/...

Review this PR? (yes / no)
```

Wait for user confirmation before proceeding.

## Step 2: Fetch Diff and Context

Fetch the full diff:

```bash
gh pr diff {number}
```

Fetch the PR metadata:

```bash
gh pr view {number} --json body,title,files
```

The PR body provides context reviewers need to understand the intent of the change.

## Step 3: Spawn 4 Review Agents in Parallel

Use the **Agent tool** to spawn all 4 reviewers simultaneously in a single message. Each agent should receive:

1. The **PR number, title, body, and full diff**
2. The **base branch** the PR targets
3. Instructions to review **this single PR** and give **actionable fixes**
4. The reviewer-specific focus area (from the reference files below)

**IMPORTANT:** Launch all 4 agents in a single message using 4 parallel Agent tool calls. Use `subagent_type: "general-purpose"` for each.

### Reviewer 1: Security

Read [reviewer-security.md](references/reviewer-security.md) for the full spawn prompt.

Focus: injection vulnerabilities, auth/authz gaps, data exposure, unsafe input handling, secrets in code, insecure dependencies, XSS, CSRF, SSRF.

### Reviewer 2: Tech Debt & Duplication

Read [reviewer-tech-debt.md](references/reviewer-tech-debt.md) for the full spawn prompt.

Focus: duplicated logic that already exists in the codebase, utilities that should have been reused, patterns that diverge from established code, unnecessary abstractions, dead code introduced.

### Reviewer 3: Internal Patterns

Read [reviewer-patterns.md](references/reviewer-patterns.md) for the full spawn prompt.

Focus: alignment with patterns and conventions defined in `CLAUDE.md` and `/docs`. Every deviation should reference the specific doc or section being violated. If docs are silent on something the PR touches, note it as a docs gap.

### Reviewer 4: Improvements

Read [reviewer-improvements.md](references/reviewer-improvements.md) for the full spawn prompt.

Focus: simpler implementations, more idiomatic code, better error handling, missed edge cases, performance opportunities. Substantive improvements only — not style nitpicks.

## Step 4: Reviewer Execution

Each reviewer agent should:

1. **Read `CLAUDE.md`** and relevant files in **`/docs`** to understand internal conventions
2. **Analyze the PR diff** carefully
3. **Read the full changed files** (not just the diff) to understand surrounding context
4. **Cross-reference the codebase** using Grep/Glob to check for existing patterns, utilities, and conventions
5. **Return findings** using the format specified in their reference prompt

## Step 5: Synthesize and Present

After ALL 4 agents complete, produce a single synthesis document:

### 5a. Verdict

Assess the overall PR readiness:

```
## Verdict: READY / NEEDS FIXES / NEEDS REWORK

PR #{number}: {title}
Findings: CRITICAL: X | HIGH: X | MEDIUM: X | LOW: X
```

- **READY**: No CRITICAL or HIGH findings. MEDIUM/LOW findings are optional improvements.
- **NEEDS FIXES**: Has HIGH findings that should be addressed before submitting for review. No CRITICAL.
- **NEEDS REWORK**: Has CRITICAL findings or multiple HIGH findings that indicate a fundamental issue.

### 5b. Action Items

Merge findings from all 4 reviewers into a single severity-ordered table:

```
## Action Items

| # | Severity | Reviewer | File:Line | Finding | Fix |
|---|----------|----------|-----------|---------|-----|
| 1 | CRITICAL | Security | src/foo.ts:42 | User input in SQL query | Use parameterised queries |
| 2 | HIGH     | Tech Debt| src/bar.ts:12 | Duplicates lib/errors.ts:formatError | Import existing utility |
| 3 | HIGH     | Patterns | src/baz.ts:88 | Violates CLAUDE.md server-first pattern | Use documented pattern |
| 4 | MEDIUM   | Improvements | src/qux.ts:15 | N+1 query in loop | Batch fetch outside loop |
| 5 | LOW      | Patterns | src/lib/new.ts | — | Add convention to /docs |
```

### 5c. Docs Gaps

Any areas where `CLAUDE.md` and `/docs` were silent on patterns the PR touches:

```
### Documentation Gaps

| Area | Suggested Doc |
|------|---------------|
| Logging conventions | /docs/patterns/logging.md |
| Error categorisation | /docs/patterns/errors.md |
```

### 5d. Post as PR Comments

Ask the user if they want to post findings as PR review comments:

```
Post HIGH+ findings as PR review comments? (yes / no)
```

If yes, use `gh pr review` to post HIGH and CRITICAL findings as review comments, grouped by file. Do NOT post MEDIUM or LOW findings to avoid noise.

**Always wait for user approval before adding PR comments.**

## Key Principles

- **All 4 reviewers run in parallel** — use a single message with 4 Agent tool calls
- **All 4 reviewers review the same PR** — holistic understanding is the point
- **Fixes over suggestions** — frame findings as things to fix before submission, not abstract suggestions
- **Wait for all reviewers** — no partial synthesis
- **Verdict is decisive** — READY, NEEDS FIXES, or NEEDS REWORK. No ambiguity.
- **User controls output** — never add PR comments without explicit approval
