# Frontend security baseline

This template treats browser code, bundled configuration, and browser storage as **untrusted client-side territory**. Anything shipped to the browser can be inspected or modified by a user or by JavaScript running in the same origin.

This phase establishes frontend guardrails. CSP, security headers, dependency auditing, and broader browser hardening are handled in v0.5.2.

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

For authenticated browser sessions, prefer server-managed cookies where applicable, with security attributes such as:

- `HttpOnly` so application JavaScript cannot read the session token;
- `Secure` so the cookie is sent only over HTTPS;
- an appropriate `SameSite` policy;
- the narrowest practical domain/path and lifetime.

The concrete BFF/session design is implemented later in the roadmap. This phase only prevents insecure client-side examples.

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

When the observability layer is introduced, logging must use a dedicated abstraction with explicit field selection and redaction. Logging an object wholesale is not considered safe redaction.

Correlation IDs are acceptable because they identify a request, not an authenticated user or credential. They must not embed sensitive values.

## URLs and navigation

Do not place credentials or secrets in:

- query strings;
- route parameters;
- URL fragments;
- redirect URLs under attacker control.

URLs can appear in browser history, proxy/server logs, analytics systems, screenshots, and referrer data.

## Executable guardrails

Run:

```bash
npm run security:check
npm run security:test
```

`security:check` scans application TypeScript/HTML and rejects:

- Angular sanitizer bypass calls;
- direct `localStorage` or `sessionStorage` access;
- direct `document.cookie` access.

ESLint additionally rejects:

- `DomSanitizer` imports;
- direct browser storage access;
- direct script-readable cookie access;
- `console.*` logging in application TypeScript.

These guardrails are intentionally strict defaults for a reusable template. Exceptions should be narrow, documented, and reviewed rather than globally disabling a rule.

## Security review checklist

Before merging frontend code, verify:

- untrusted data uses normal Angular bindings;
- sanitizer bypass APIs are absent or explicitly reviewed;
- no secret is present in client configuration;
- credentials are not persisted in Web Storage;
- JavaScript does not read session cookies;
- logs contain no credentials, sensitive payloads, or PII;
- URL parameters do not carry secrets;
- security exceptions include tests and rationale.
