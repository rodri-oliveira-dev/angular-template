# HTTP and API integration

The template keeps transport concerns outside components and pages.

## Composition root

`app.config.ts` configures Angular `HttpClient` using provider-based APIs:

- typed API configuration;
- correlation ID interceptor;
- HTTP telemetry interceptor;
- standardized HTTP error interceptor;
- optional local example mock.

The default template configuration is:

```ts
provideApiConfig({
  basePath: '/api',
  useLocalMock: true,
});
```

The base path is intentionally relative. This works with a local proxy, a same-origin API, or the BFF integration introduced later in the roadmap.

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

The template starts with `useLocalMock: true` so the reference feature can demonstrate GET and POST flows without external infrastructure.

The mock:

- intercepts only the reference collection URL;
- returns the same transport DTO shape expected by the real client;
- preserves correlation IDs;
- returns Problem Details for invalid writes.

Set `useLocalMock: false` when a real API or development proxy is available.

## Adding an endpoint

1. Keep the API operation in the owning feature's `data-access/` directory.
2. Add request/response DTOs that reflect the external contract.
3. Map DTOs to feature models when the UI should not depend directly on transport shape.
4. Use the configured base path instead of hardcoding hostnames in components.
5. Let core interceptors handle correlation and standardized HTTP errors.
6. Add success and error tests with Angular's HTTP testing utilities.
7. Document any endpoint-specific behavior that affects callers.

## Security baseline

Do not store sensitive access or refresh tokens in browser storage as part of this HTTP layer. Do not log authorization headers, cookies, or raw sensitive request/response payloads.

Client-side configuration is public and must not contain secrets.

See [Frontend security baseline](../security/README.md) for sanitization, storage, cookies, logging, and client-configuration rules. Authentication and BFF-specific session handling are intentionally addressed in later roadmap phases.
