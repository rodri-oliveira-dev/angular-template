> 🌐 Language: **English** | [Português (Brasil)](../pt-BR/http/README.md)

# HTTP and API integration

The template keeps transport concerns outside components and pages.

## Composition root

`app.config.ts` configures Angular `HttpClient` using provider-based APIs:

- typed API configuration;
- correlation ID interceptor;
- HTTP telemetry interceptor;
- standardized HTTP error interceptor;
- optional local example mock.

The composition root receives `apiRuntimeConfig`. The production/default runtime configuration is:

```ts
{
  basePath: '/api',
  mode: 'bff',
}
```

The normal Angular development configuration uses file replacement to select:

```ts
{
  basePath: '/api',
  mode: 'mock',
}
```

The API base path is intentionally same-origin. Absolute URLs and protocol-relative URLs are rejected by `normalizeSameOriginBasePath`.

This keeps deployment topology and internal service URLs out of the frontend.

## BFF connectivity

The target browser boundary is:

```text
Angular SPA -> same-origin /api -> .NET BFF -> internal APIs
```

Use:

```bash
npm start
```

for the zero-dependency local mock.

Use:

```bash
npm run start:bff
```

to run Angular with `src/proxy.bff.conf.json`, which proxies `/api/**` to the local BFF target.

See [BFF connectivity](../bff/README.md) for runtime modes, proxy configuration, and responsibility boundaries.

## Feature-owned data access

A feature owns its transport details:

```text
features/example/data-access/
├── example-api-client.ts
├── example-api.dto.ts
└── ...
```

Pages depend on `ExampleApiClient`, not on `HttpClient`.

Transport DTOs are mapped before they reach the UI whenever the server contract is not the desired presentation model. Avoid a generic repository that erases meaningful API semantics.

Feature data-access code may know the browser-facing BFF route (for example `/api/examples`). It must not know which internal/downstream service the BFF calls.

## Correlation IDs

Outgoing requests receive `X-Correlation-ID` when they do not already contain one.

For errors, the standardized mapper looks for correlation information in this order:

1. the `X-Correlation-ID` response header;
2. a `correlationId` Problem Details extension;
3. a `traceId` Problem Details extension.

Do not put credentials or sensitive payload values in correlation headers.

HTTP telemetry records the response correlation ID when available and otherwise preserves the outgoing request ID. Correlation IDs are recorded as structured metadata, never embedded into event names.

## Problem Details

HTTP failures compatible with RFC 7807/Problem Details are mapped to `ApiError`.

The UI can use the standardized status, message, Problem Details payload, and correlation ID without depending on `HttpErrorResponse`.

Non-HTTP errors are not rewritten by the interceptor.

The HTTP telemetry interceptor emits one `http.client.request` event for success/failure/cancellation and does not emit a separate telemetry error record. This prevents duplicate reporting of the same HTTP failure.

## HTTP telemetry schema

The client records only low-cardinality transport metadata:

- method;
- outcome;
- status when available;
- duration in milliseconds;
- correlation ID.

Full URL/query strings, bodies, headers, cookies, and auth values are deliberately omitted.

## Loading, errors, and cancellation

The reference page uses signals for loading/error state and `takeUntilDestroyed` for subscription lifetime management.

Feature code should:

- expose loading state intentionally;
- convert technical errors to appropriate user-facing messages;
- avoid orphaned subscriptions;
- prefer Angular/RxJS lifecycle-aware cancellation.

## Local API mock

The normal development configuration uses `mode: 'mock'` so the reference feature can demonstrate GET and POST flows without external infrastructure.

The mock:

- intercepts only the configured reference collection URL;
- returns the same transport DTO shape expected by the BFF-facing client;
- preserves correlation IDs;
- returns Problem Details for invalid writes.

The BFF configuration uses `mode: 'bff'`; the mock interceptor immediately passes requests through.

## Adding an endpoint

1. Keep the browser-facing BFF operation in the owning feature's `data-access/` directory.
2. Add request/response DTOs that reflect the BFF contract.
3. Map DTOs to feature models when the UI should not depend directly on transport shape.
4. Use the configured same-origin base path instead of hardcoding hostnames.
5. Do not encode internal/downstream API topology in Angular.
6. Let core interceptors handle correlation and standardized HTTP errors.
7. Add success and error tests with Angular's HTTP testing utilities.
8. Document endpoint-specific behavior that affects callers.

## Security baseline

Do not store sensitive access or refresh tokens in browser storage as part of this HTTP layer. Do not log authorization headers, cookies, or raw sensitive request/response payloads.

Client-side configuration is public and must not contain secrets.

The BFF baseline uses a server-managed session cookie, Angular's explicit XSRF contract, and no global `withCredentials` opt-in. Upstream access/refresh tokens remain server-side and are never persisted by the Angular application.

See [BFF connectivity](../bff/README.md) for the browser-facing contract, session/XSRF model, correlation boundary, and Angular/BFF/domain-service responsibilities. See [Frontend security baseline](../security/README.md) for sanitization, storage, cookies, logging, and client-configuration rules.
