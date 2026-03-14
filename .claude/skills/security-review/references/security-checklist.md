# Security Checklist

Structured checklist for auditing code changes. Check every item against the changed files.

---

## Critical (must fix before merge)

### SQL Injection / NoSQL Injection
- [ ] All database queries use parameterised queries (Drizzle ORM query builder, not raw SQL)
- [ ] No string concatenation or template literals in query construction
- [ ] JSONB operators use Drizzle's typed helpers, not raw SQL fragments
- [ ] Any `sql` tagged template from Drizzle uses `sql.placeholder()` for dynamic values

### Authentication Bypass or Missing Auth Checks
- [ ] Every API route (GET, POST, PATCH, DELETE) calls `getSession()` as its first operation
- [ ] Session wallet is used for identity — never trust wallet/userId from request body
- [ ] Auth check cannot be skipped via HTTP method confusion (e.g., GET vs POST)
- [ ] Middleware-level auth is not the sole protection — routes verify independently

### Authorisation Failures (IDOR)
- [ ] After auth, verify the authenticated user owns or has access to the requested resource
- [ ] Paper access checks: user is owner, co-author (contributor on authorship contract), assigned reviewer, or journal editor
- [ ] Review access checks: reviewer is assigned to this submission
- [ ] Submission access checks: paper belongs to user's journal (editor) or user is the author
- [ ] No API route returns data for resource IDs without verifying the caller's relationship

### Secrets in Code
- [ ] No API keys, private keys, or credentials in source files
- [ ] No secrets in committed `.env` files (`.env.local` should be in `.gitignore`)
- [ ] No hardcoded Hedera operator keys, Thirdweb client secrets, or JWT signing keys
- [ ] No secrets in client-side code (`NEXT_PUBLIC_` vars are public — verify they should be)
- [ ] No secrets in error messages, logs, or API responses

### Remote Code Execution
- [ ] No `eval()`, `Function()`, or `new Function()` with user input
- [ ] No `child_process.exec()` with unsanitized input
- [ ] No dynamic `require()` or `import()` with user-controlled paths
- [ ] No template engines with user-controlled templates

### Unvalidated Redirects
- [ ] All redirects use relative paths or validate against an allowlist of domains
- [ ] No `redirect(userInput)` or `NextResponse.redirect(userInput)` without validation
- [ ] Login/callback redirect URLs are validated

### Server-Side Request Forgery (SSRF)
- [ ] No `fetch()` with user-controlled URLs on the server side
- [ ] IPFS/web3.storage URLs are constructed from known CIDs, not user input
- [ ] Hedera Mirror Node URLs use the configured base URL, not user input
- [ ] Internal service URLs are not exposed or controllable

---

## High (should fix before merge)

### Cross-Site Scripting (XSS)
- [ ] No `dangerouslySetInnerHTML` with user-supplied content
- [ ] User-generated text is rendered as text nodes, not HTML
- [ ] URLs in `href` or `src` are validated (no `javascript:` protocol)
- [ ] API responses with user content set appropriate `Content-Type` headers
- [ ] PDF content served via content route uses appropriate headers

### Cross-Site Request Forgery (CSRF)
- [ ] State-changing operations (POST, PATCH, DELETE) verify origin
- [ ] Cookie-based auth (`httpOnly` JWT) is protected against CSRF
- [ ] API routes that perform mutations are not accessible via simple GET requests

### Insecure Direct Object References
- [ ] Sequential/predictable IDs are not the sole access control mechanism
- [ ] API routes check ownership before returning or modifying resources
- [ ] Invitation tokens are unguessable (cryptographically random)

### Missing Input Validation
- [ ] All API route inputs are validated with Zod schemas before use
- [ ] File uploads validate content type and size
- [ ] Pagination parameters are bounded (no unbounded `LIMIT`)
- [ ] String inputs have reasonable length limits
- [ ] Enum values are validated against the allowed set

### Overly Permissive CORS
- [ ] CORS headers are not set to `*` in production
- [ ] `Access-Control-Allow-Credentials` is only set with specific origins
- [ ] Preflight responses don't allow all methods/headers

### Sensitive Data in Logs
- [ ] No PII (emails, names, wallet addresses) in application logs
- [ ] No tokens, session IDs, or passwords logged
- [ ] Error handlers don't log full request bodies that may contain sensitive data
- [ ] Console.log statements don't leak sensitive variables

### Insecure Dependencies
- [ ] New dependencies are from trusted, maintained packages
- [ ] No known CVEs in added or updated packages (`npm audit`)
- [ ] Dependencies don't request excessive permissions
- [ ] Lock file is committed and consistent

---

## Medium (fix soon)

### Missing Rate Limiting
- [ ] Authentication endpoints have rate limiting
- [ ] Password/key-based operations are rate-limited
- [ ] File upload endpoints have rate limiting
- [ ] Expensive operations (Hedera transactions, IPFS uploads) are rate-limited
- [ ] Cron endpoints verify `CRON_SECRET` header

### Verbose Error Messages
- [ ] API error responses don't include stack traces
- [ ] Database errors are caught and return generic messages
- [ ] Hedera SDK errors don't expose operator IDs or keys in responses
- [ ] 500 errors return `{ error: "Internal server error" }`, not the actual error

### Missing Security Headers
- [ ] `Content-Security-Policy` is configured
- [ ] `X-Content-Type-Options: nosniff` is set
- [ ] `X-Frame-Options` or `frame-ancestors` CSP directive is set
- [ ] `Strict-Transport-Security` is set in production
- [ ] `Referrer-Policy` is configured

### Weak Cryptographic Choices
- [ ] SHA-256 or stronger for content hashing (not MD5 or SHA-1)
- [ ] JWT signing uses RS256 or ES256 (not HS256 with weak secret)
- [ ] Random values use `crypto.randomUUID()` or `crypto.getRandomValues()`, not `Math.random()`
- [ ] Invite tokens are cryptographically random with sufficient entropy

### Session Handling
- [ ] JWT cookies are `httpOnly`, `secure`, and `sameSite`
- [ ] Session expiration is reasonable (not indefinite)
- [ ] Session is invalidated on role change or sensitive operations
- [ ] No session data stored in localStorage or sessionStorage (project convention)

---

## Low (note for awareness)

### Defence-in-Depth Opportunities
- [ ] Could add Content-Security-Policy `report-uri` for monitoring
- [ ] Could add Subresource Integrity (SRI) for external scripts
- [ ] Could add additional validation layers beyond the primary check
- [ ] Could implement request signing for internal service calls

### Logging Gaps
- [ ] Security-relevant events are logged (auth failures, permission denials, unusual patterns)
- [ ] Audit trail exists for sensitive operations (role changes, data deletion)
- [ ] Logs include enough context for incident investigation (request ID, timestamp, action)

### Minor Hardening
- [ ] HTTP methods are explicitly constrained (no catch-all handlers)
- [ ] Unused API routes or endpoints are removed
- [ ] Debug endpoints or development-only code is not present in production paths
- [ ] Error boundaries don't expose component tree information
