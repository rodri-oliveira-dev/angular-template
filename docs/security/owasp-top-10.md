# OWASP Top 10:2025 coverage

This document maps the template's current security controls to the OWASP Top 10:2025.

The mapping is a security baseline, not a compliance certification. Some OWASP risks cannot be fully controlled by a browser-only Angular repository and remain responsibilities of the BFF, domain services, infrastructure, or deployment platform.

## Coverage matrix

| OWASP category | Angular template coverage | Primary controls |
| --- | --- | --- |
| A01 — Broken Access Control | Partial / server-dependent | same-origin BFF boundary, no downstream topology in Angular, server-side authorization responsibility documented |
| A02 — Security Misconfiguration | Strong frontend baseline | Angular autoCSP, same-origin API configuration, provider-neutral response-header baseline, restrictive browser policy guidance |
| A03 — Software Supply Chain Failures | Enforced | lockfile + `npm ci`, Dependabot, SHA-pinned GitHub Actions, `npm audit --audit-level=high` as a mandatory CI gate |
| A04 — Cryptographic Failures | Partial / deployment-dependent | HTTPS, Secure cookie and HSTS guidance; cryptography and TLS termination stay outside Angular |
| A05 — Injection | Strong frontend baseline | Angular contextual sanitization, blocked sanitizer bypass APIs, CSP, ESLint/security AST guardrails, CodeQL |
| A06 — Insecure Design | Partial | feature boundaries, BFF trust boundary, server-managed session model, CSRF design, explicit responsibility split |
| A07 — Authentication Failures | Partial / BFF-dependent | HttpOnly/Secure/SameSite session guidance, no access/refresh tokens in Web Storage, BFF-owned authentication session |
| A08 — Software or Data Integrity Failures | Strong build baseline | immutable Action SHAs, lockfile, deterministic install, CodeQL, dependency automation |
| A09 — Security Logging & Alerting Failures | Partial | sanitized telemetry, correlation IDs, no sensitive console logging; operational alerting remains deployment-specific |
| A10 — Mishandling of Exceptional Conditions | Strong frontend baseline | standardized Problem Details / `ApiError`, deterministic error paths, unit/integration/E2E coverage |

## Automated security gates

Pull requests and pushes to `main` run multiple complementary controls:

### SAST

GitHub CodeQL analyzes JavaScript/TypeScript independently from the main CI workflow.

### SCA / supply-chain checks

The main CI workflow runs:

```bash
npm ci
npm run security:all
```

`security:all` executes:

- tests for the repository's security scanner;
- executable frontend security guardrails;
- `npm audit --audit-level=high`.

High or Critical dependency advisories therefore fail the pull-request gate.

### Frontend source guardrails

The custom AST scanner and ESLint prohibit or flag:

- Angular sanitizer bypass APIs;
- direct `DomSanitizer` imports;
- direct `localStorage` and `sessionStorage` use;
- direct script-readable session-cookie access;
- `console.*` in application code.

### DAST

After a production build, CI serves the generated SPA locally and executes an OWASP ZAP Baseline scan.

The ZAP action is pinned to an immutable commit SHA, does not open repository issues automatically, and fails the CI gate when non-accepted alerts are found.

If an alert is genuinely caused by the temporary CI web server or another known non-production condition, suppress it only through a reviewed repository rule that includes a documented rationale. Do not globally disable ZAP alert classes merely to make CI green.

## Responsibility boundary

This repository can validate browser and frontend behavior, but it cannot prove the security of a future BFF or downstream service.

Applications created from the template must separately validate, where applicable:

- object/function-level authorization;
- server-side input validation and injection controls;
- authentication flows, credential lifecycle, lockout and MFA policy;
- TLS configuration and cryptographic key management;
- SSRF controls and outbound-network policy;
- database and message-broker security;
- operational logging, detection and alerting;
- infrastructure/IaC configuration;
- authenticated DAST/API scanning.

The BFF is a trust boundary, not a substitute for authorization or server-side validation.
