> 🌐 Language: **English** | [Português (Brasil)](../pt-BR/bff/README.md)

# BFF connectivity

The target browser boundary is:

```text
Angular SPA
    |
    | same-origin /api
    v
.NET BFF
    |
    +--> internal APIs
```

Angular owns only the browser-facing BFF contract. It must not contain hostnames, service discovery data, or URLs for internal/downstream APIs.

## Runtime modes

The template has two frontend API modes:

| Mode   | Purpose                           | API base path     |
| ------ | --------------------------------- | ----------------- |
| `mock` | zero-dependency local development | `/api`            |
| `bff`  | real BFF connectivity             | `/api` by default |

Production builds use the BFF configuration by default.

The normal development configuration replaces `api.runtime-config.ts` with `api.runtime-config.mock.ts`, so:

```bash
npm start
```

continues to run without any backend.

To run against a local BFF:

```bash
npm run start:bff
```

The browser still calls paths such as:

```text
/api/examples
```

It never calls an internal service URL directly.

## Same-origin policy

`ApiConfig.basePath` accepts only application-relative same-origin paths such as:

```text
/api
/bff/api
```

Absolute URLs, protocol-relative URLs, query strings, and fragments are rejected by configuration normalization.

This is intentional. Deployment topology belongs behind the BFF/reverse proxy, not in Angular code.

Client-side configuration is public and must never contain secrets.

## Local development proxy

The BFF serve configuration uses:

```text
src/proxy.bff.conf.json
```

with the default local target:

```text
http://localhost:5000
```

The Angular dev server receives browser requests on `http://localhost:4200/api/**` and proxies them to the local BFF. From the browser's perspective, requests remain same-origin.

If your local BFF listens on another port, update only the proxy target. Do not replace Angular's `/api` path with an internal API URL.

Because Angular 22 uses the Vite-based `@angular/build:dev-server`, the proxy context is written as `/api/**` so nested paths are matched.

Restart `ng serve` after changing the proxy file.

## Data-access boundary

Feature data-access services continue to build URLs from `API_CONFIG.basePath`.

For example:

```text
/api + /examples -> /api/examples
```

Components and pages do not know whether the request is served by:

- the local mock;
- the local Angular proxy;
- a production reverse proxy/BFF.

That decision stays in the composition/configuration layer.

## Session and authentication boundary

The BFF owns the authenticated browser session. The Angular application must not receive, persist, or refresh upstream access/refresh tokens.

Recommended production flow:

```text
Browser
  |
  | __Host-bff-session (HttpOnly, Secure, SameSite)
  v
.NET BFF
  |
  +--> stores or exchanges upstream credentials server-side
```

The session cookie should be opaque to Angular and inaccessible to application JavaScript. For production, prefer a host-only cookie such as `__Host-bff-session` with:

- `HttpOnly`;
- `Secure`;
- `Path=/`;
- no `Domain` attribute;
- `SameSite=Strict` when the product flow permits it, otherwise an explicitly justified `Lax`.

Local plain-HTTP development may require a development-only cookie policy or local HTTPS because production `Secure` cookies must not be weakened in deployed environments.

Access tokens, refresh tokens, session identifiers, and bearer credentials must not be stored in `localStorage` or `sessionStorage`.

## XSRF / CSRF protection

Cookie-authenticated write requests require CSRF protection in addition to `SameSite`.

The Angular client explicitly uses the conventional Angular XSRF contract:

| Purpose          | Name           |
| ---------------- | -------------- |
| anti-CSRF cookie | `XSRF-TOKEN`   |
| request header   | `X-XSRF-TOKEN` |

The BFF should issue a random anti-CSRF cookie named `XSRF-TOKEN`. Unlike the authentication/session cookie, this anti-CSRF cookie must be readable by Angular, so it is intentionally **not** `HttpOnly`.

For same-origin mutating requests, Angular reads `XSRF-TOKEN` and sends the value in `X-XSRF-TOKEN`. The BFF must validate that header before accepting state-changing requests.

Angular does not attach the XSRF header to safe requests such as `GET`/`HEAD`, or to absolute cross-origin URLs.

The anti-CSRF token is not an authentication credential and must not be reused as a session identifier.

## Credentials and origin policy

The template does **not** enable `withCredentials` globally.

For the intended same-origin `/api` architecture, the browser sends applicable same-origin cookies according to normal cookie rules without Angular opting every request into cross-origin credentials.

This prevents credential behavior from being broadened indiscriminately and keeps the default browser/BFF boundary simple.

If a real application must use a cross-origin credentialed BFF, treat that as an explicit architecture exception. It requires, at minimum:

- an exact trusted-origin allowlist;
- `Access-Control-Allow-Credentials: true`;
- no wildcard `Access-Control-Allow-Origin: *`;
- an explicit per-request/client credentials policy;
- a CSRF design suitable for the cross-origin deployment.

The default template does not implement that exception.

## CORS versus same-origin

The preferred deployment keeps Angular and the BFF under the same browser origin. In that topology, browser calls to `/api` do not require CORS.

CORS is only a controlled relaxation of the Same Origin Policy. It is not authentication, authorization, or CSRF protection.

The local Angular proxy preserves this model from the browser's perspective: the browser calls the Angular development origin and the dev server proxies `/api/**` to the local BFF.

## Reference integration contract

The reference feature proves that the same Angular data-access client works with either the local mock or the BFF mode.

Its browser-facing contract is intentionally small:

| Operation | Browser route        | Request              | Success response           |
| --------- | -------------------- | -------------------- | -------------------------- |
| List      | `GET /api/examples`  | no body              | `200` + `ExampleItemDto[]` |
| Create    | `POST /api/examples` | `{ "name": string }` | `201` + `ExampleItemDto`   |

`ExampleItemDto` contains the transport fields `id` and `name`. The feature data-access layer maps that DTO to the UI-facing `ExampleItem` model, so components and pages do not depend directly on the transport representation.

Errors use Problem Details. A BFF error can therefore expose fields such as:

- `type`;
- `title`;
- `status`;
- `detail`;
- `correlationId` or `traceId` extensions when appropriate.

Angular maps compatible error responses to `ApiError`. The page consumes the normalized error rather than `HttpErrorResponse`.

State-changing calls also participate in the XSRF contract described above.

## Correlation and tracing boundary

Angular generates or preserves `X-Correlation-ID` on outgoing BFF requests.

The BFF should:

1. accept the incoming correlation value when valid, or establish its own request correlation according to server policy;
2. associate that correlation with its server-side trace/span context;
3. propagate suitable correlation/trace context to downstream services;
4. return `X-Correlation-ID` on the browser-facing response;
5. include a safe `correlationId` or `traceId` Problem Details extension when useful for support.

Frontend HTTP telemetry records only low-cardinality metadata: method, status, outcome, duration, and correlation ID. It deliberately excludes URLs/query strings, bodies, cookies, and authentication values.

## Responsibility split

| Layer           | Responsibilities                                                                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Angular         | UI state, feature-owned data access, browser-facing DTO mapping, XSRF header handling, correlation/telemetry consumption                            |
| BFF             | browser session, CSRF validation, authorization boundary, `/api` contract, downstream orchestration, Problem Details, correlation/trace propagation |
| Domain services | domain/business capabilities, service-level authorization and invariants, persistence/integration concerns; no browser-session responsibilities     |

Components and pages remain unaware of whether data comes from the local mock or the BFF. Only the composition/configuration and data-access layers know the browser-facing API boundary.

## Automated verification

The template verifies both runtime modes:

- `npm run e2e:mock` starts the normal development mode and uses the local interceptor;
- `npm run e2e:bff` starts Angular in BFF mode and uses Playwright network interception as a deterministic stand-in for the browser-facing BFF contract;
- `npm run e2e` runs both suites.

The BFF E2E suite checks same-origin reads/writes, correlation headers, XSRF on writes, DTO mapping, and Problem Details rendering without requiring a real external backend.

## Deliberately not included

The Angular template does not implement:

- the .NET BFF itself;
- identity-provider/OIDC login orchestration;
- application-specific session refresh/logout endpoint contracts;
- downstream/domain service implementations.

Those server-side concerns can be layered behind the documented browser contract without exposing upstream credentials or topology to Angular.
