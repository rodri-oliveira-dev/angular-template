# Frontend security baseline

This template treats browser code, bundled configuration, and browser storage as **untrusted client-side territory**. Anything shipped to the browser can be inspected or modified by a user or by JavaScript running in the same origin.

The v0.5 block combines source guardrails, dependency auditing, Angular CSP hardening, and deployment-header guidance.

## HTML binding and sanitization

Prefer Angular templates, interpolation, and property binding. Angular applies context-aware escaping and sanitization to supported bindings.

For dynamic HTML:

- prefer plain text interpolation whenever rich HTML is not required;
- when rich HTML is required, bind the untrusted string through Angular and allow Angular to sanitize it;
- do not manipulate the DOM directly to bypass Angular's security model;
- do not construct templates from user-controlled strings.

### Sanitizer bypass policy

The baseline prohibits direct use of:

- `bypassSecurityTrustHtml`;
- `bypassSecurityTrustStyle`;
- `bypassSecurityTrustScript`;
- `bypassSecurityTrustUrl`;
- `bypassSecurityTrustResourceUrl`.

The ESLint configuration blocks importing `DomSanitizer` into application TypeScript, and `npm run security:check` independently detects sanitizer bypass calls.

If a real application has a legitimate exception:

1. document the exact trust boundary and threat model;
2. validate or constrain the value before it reaches the bypass;
3. isolate the bypass in one narrowly scoped adapter;
4. add tests for malicious and expected inputs;
5. add an exact-file exception to the guardrail rather than disabling the rule globally;
6. require explicit security review in the PR.

A bypass must never be introduced simply to silence Angular sanitization.

## Client configuration is public

Values compiled into Angular bundles or delivered to JavaScript at runtime are visible to the browser.

Client-side configuration is appropriate for values such as:

- API base paths;
- feature flags that are not authorization controls;
- public identifiers;
- non-secret telemetry configuration.

Do not put these values in client configuration:

- passwords;
- client secrets;
- private keys;
- database credentials;
- long-lived bearer tokens;
- signing secrets;
- any value whose confidentiality is required for security.

Environment files, injected runtime JSON, and build-time variables do **not** become secret merely because they are named "environment" or injected during deployment.

## Browser storage

The baseline blocks direct application access to `localStorage` and `sessionStorage`.

Never persist these values in Web Storage:

- access tokens;
- refresh tokens;
- session identifiers;
- JWTs used as credentials;
- passwords or recovery secrets;
- sensitive PII.

Web Storage is readable by JavaScript in the origin, so an XSS vulnerability can expose it.

If a future feature needs durable non-sensitive preferences, introduce a small reviewed storage abstraction and document exactly what data it permits.

## Cookies and sessions

Direct `document.cookie` access is blocked.

For authenticated browser sessions, prefer server-managed cookies where applicable:

- `HttpOnly` so application JavaScript cannot read the session token;
- `Secure` so the cookie is sent only over HTTPS;
- `SameSite=Strict` when the product flow permits it, otherwise an explicitly justified `Lax`;
- `SameSite=None` only together with `Secure`;
- the narrowest practical lifetime and scope.

For a host-only session cookie, prefer the `__Host-` prefix with `Secure`, `Path=/`, and no `Domain` attribute.

`SameSite` is defense in depth and does not replace a CSRF strategy for cookie-authenticated state-changing requests.

For the BFF baseline:

- Angular never reads the authentication/session cookie;
- upstream access and refresh tokens remain server-side and are never persisted in Web Storage;
- `XSRF-TOKEN` is a separate, non-secret anti-CSRF cookie that Angular may read;
- Angular sends that value as `X-XSRF-TOKEN` on same-origin state-changing requests;
- the BFF must validate the anti-CSRF header before performing the state change;
- `withCredentials` is not enabled globally because the default architecture is same-origin.

Do not mark `XSRF-TOKEN` as `HttpOnly`: Angular must be able to read the anti-CSRF token. This exception applies only to the anti-CSRF token, not to the authentication/session cookie.

See [BFF connectivity and session security](../bff/README.md) for the complete boundary.

## Logging and sensitive data

Application TypeScript is configured with ESLint `no-console`.

Do not log:

- access or refresh tokens;
- `Authorization` headers;
- cookies or session identifiers;
- passwords or secrets;
- full request/response bodies by default;
- sensitive PII;
- raw authentication or payment payloads.

Observability uses the dedicated `TelemetryClient` abstraction with explicit field selection and sanitization. Logging an object wholesale is not considered safe redaction. The baseline local adapter records only bounded, sanitized in-memory entries and does not write to console, storage, or network endpoints.

Correlation IDs are acceptable because they identify a request, not an authenticated user or credential. They must not embed sensitive values.

## URLs and navigation

Do not place credentials or secrets in:

- query strings;
- route parameters;
- URL fragments;
- redirect URLs under attacker control.

URLs can appear in browser history, proxy/server logs, analytics systems, screenshots, and referrer data.

## Dependency audit

Run the lockfile-based dependency audit with:

```bash
npm run security:audit
```

The command uses `npm audit --audit-level=high` and includes both runtime and development dependencies. Development tooling remains part of the software supply chain and is not excluded from the default security gate.

The command is reproducible as a process from the committed `package-lock.json`, but results can change over time as the npm advisory database is updated.

### Vulnerability policy

- **Critical / High:** fail the security gate and remediate before merge.
- **Moderate:** triage for reachability, production impact, exploitability, and whether it affects build-only tooling. Fix promptly when reachable or production-facing.
- **Low:** track and batch with normal dependency maintenance unless context raises the risk.

A temporary exception for a High/Critical issue requires:

1. the exact advisory/package/version;
2. documented reachability and exploitability analysis;
3. compensating controls;
4. an owner;
5. an expiration/review date;
6. explicit security approval.

Do not use `npm audit fix --force` automatically. Major-version or dependency-tree changes require normal compatibility review and test validation.

## Content Security Policy

Production builds enable Angular CLI `security.autoCsp`.

Angular generates a CSP meta policy for scripts using hashes and `strict-dynamic`. This is useful for cacheable static hosting because it does not require a predictable or reused nonce.

`autoCsp` does **not** fully replace deployment headers:

- it protects scripts but not every resource type;
- `frame-ancestors` is not effective from a meta-delivered CSP;
- style handling still needs a hosting decision;
- reporting and other host controls belong in HTTP response headers.

The repository includes [security-headers.example.txt](security-headers.example.txt) as a provider-neutral complement.

Because `autoCsp` already supplies the script policy, the complementary HTTP CSP intentionally omits both `script-src` and `default-src`. Adding either without matching the generated hashes can break the application because multiple CSP policies are enforced together.

The template example allows `'unsafe-inline'` only in `style-src`, because Angular inserts component styles at runtime. A deployment capable of injecting a unique per-response style nonce can tighten this further.

## Recommended browser response headers

The provider-neutral example contains:

- `Content-Security-Policy`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY` as legacy clickjacking defense in addition to CSP `frame-ancestors`;
- a restrictive `Permissions-Policy`.

HTTPS-only deployments should also consider HSTS at the actual hosting layer after confirming all affected domains/subdomains are HTTPS-ready.

Security headers belong on the HTTP response emitted by the CDN, reverse proxy, BFF, ingress, or web server. Angular application code cannot reliably enforce them after the document has already loaded.

## CORS is not a security-header substitute

CORS controls whether browser JavaScript at one origin can read responses from another origin. It relaxes the browser's Same Origin Policy for selected origins.

CORS does **not**:

- authenticate a caller;
- authorize access to an API;
- prevent XSS;
- replace CSP;
- replace CSRF protection;
- stop non-browser clients from making requests.

For credentialed APIs, use an explicit allowlist of trusted origins rather than `*`, and validate authentication/authorization server-side on every request.

A same-origin SPA/BFF deployment typically needs less CORS configuration, which is why the template prefers same-origin `/api` access.

## Executable guardrails

Run:

```bash
npm run security:check
npm run security:test
npm run security:audit
```

Or all three together:

```bash
npm run security:all
```

`security:all` is a required CI gate. It runs the security-scanner tests, the executable source scan, and `npm audit --audit-level=high`.

The production build is also scanned by OWASP ZAP Baseline in CI. The DAST target is served by a CI-only Node harness that applies the provider-neutral headers from `security-headers.example.txt`; it is not a production web server. Reviewed ZAP exceptions are versioned in `.zap/rules.tsv`.

See [OWASP Top 10:2025 coverage](owasp-top-10.md) for the control matrix, automated gates, exception policy, and responsibility boundaries.

`security:check` parses application TypeScript and rejects executable references while ignoring comments and string literals:

- Angular sanitizer bypass calls;
- direct `localStorage` or `sessionStorage` access;
- direct `document.cookie` access, including computed `document['cookie']` access.

ESLint additionally rejects:

- `DomSanitizer` imports;
- direct browser storage access;
- direct script-readable cookie access;
- `console.*` logging in application TypeScript.

These guardrails are intentionally strict defaults for a reusable template. Exceptions should be narrow, documented, and reviewed rather than globally disabling a rule.

## Security review checklist

Before merging frontend code, verify:

- dependency audit meets the vulnerability policy;
- untrusted data uses normal Angular bindings;
- sanitizer bypass APIs are absent or explicitly reviewed;
- no secret is present in client configuration;
- credentials are not persisted in Web Storage;
- JavaScript does not read session cookies;
- session cookies use appropriate `Secure`, `HttpOnly`, and `SameSite` attributes;
- cookie-authenticated writes use the reviewed XSRF/CSRF mechanism;
- cross-origin credentials are not enabled indiscriminately;
- logs contain no credentials, sensitive payloads, or PII;
- URL parameters do not carry secrets;
- production hosting applies the reviewed CSP and browser headers;
- CORS rules are not being used as authorization;
- security exceptions include tests, rationale, owner, and expiry.
