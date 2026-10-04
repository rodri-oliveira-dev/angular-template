# Observability

The template starts with a vendor-neutral telemetry boundary instead of binding feature code directly to a monitoring SDK.

## Telemetry API

Application code depends on `TelemetryClient`:

```ts
telemetry.event('checkout.started', {
  source: 'cart',
});

telemetry.error(error, {
  source: 'global',
});
```

The API deliberately keeps attributes flat and primitive. Do not send arbitrary request/response objects, domain entities, or browser state.

Event names should be stable, low-cardinality identifiers chosen by the application, not user-controlled values.

## Providers

Use `provideTelemetry` at the application composition root.

The baseline supports:

- `local` — keeps a bounded in-memory record buffer useful for development and tests;
- `noop` — discards telemetry;
- `enabled: false` — also selects the no-op implementation.

Example:

```ts
provideTelemetry({
  enabled: true,
  mode: 'local',
  localBufferSize: 100,
});
```

A production vendor adapter can be introduced later without changing feature code.

## Global errors

Angular's `provideBrowserGlobalErrorListeners()` forwards browser `error` and `unhandledrejection` events to the root `ErrorHandler`.

The template provides `TelemetryErrorHandler` as the root handler. It reports unexpected global errors through `TelemetryClient`.

Errors that can be handled meaningfully at their call site should still be handled there. The global handler is for unexpected failures and reporting, not application recovery.

## Sensitive-data policy

Telemetry must never intentionally contain:

- access or refresh tokens;
- authorization headers;
- cookies or session identifiers;
- passwords, secrets, or private keys;
- request/response payloads;
- sensitive PII such as email, phone, CPF/CNPJ, or government document values.

The baseline sanitizer:

- drops known sensitive attribute keys;
- redacts obvious bearer tokens, JWT-shaped values, and email-shaped values;
- truncates long strings;
- records only the JavaScript error type for errors, not error messages or stack traces.

This sanitizer is defense in depth, not permission to send arbitrary objects. Callers remain responsible for selecting safe fields.

## HTTP telemetry

The HTTP pipeline emits exactly one `http.client.request` event per completed, failed, or cancelled request.

The minimum schema is:

| Attribute       | Meaning                                                                   |
| --------------- | ------------------------------------------------------------------------- |
| `method`        | HTTP method such as GET or POST                                           |
| `outcome`       | `success`, `error`, or `cancelled`                                        |
| `status`        | HTTP status when available                                                |
| `durationMs`    | client-observed request duration in milliseconds                          |
| `correlationId` | response correlation ID when available, otherwise the outgoing request ID |

The event intentionally does **not** contain:

- full URLs or query strings;
- request/response bodies;
- headers;
- cookies;
- authentication values.

This keeps cardinality and sensitive-data exposure low.

### Error strategy

The HTTP telemetry interceptor observes failures but does not call `telemetry.error()`.

`httpErrorInterceptor` remains the single place that converts Angular `HttpErrorResponse` into `ApiError`. HTTP telemetry then records the normalized status/correlation as a structured request event.

This avoids emitting both an HTTP event and a second error record for the same transport failure.

Interceptor order is intentional:

1. correlation ID;
2. HTTP telemetry;
3. HTTP error normalization;
4. feature/local transport adapters.

Because response processing unwinds in reverse, telemetry observes the already-normalized `ApiError`.

## Local telemetry

`LocalTelemetryClient` keeps only a bounded in-memory buffer and never writes to console, browser storage, cookies, or network endpoints.

The local adapter is deliberately simple. It exists so the abstraction is observable in tests and replaceable later, without introducing a vendor dependency in the foundation phase.

## Scope of v0.6

The v0.6 and v0.6.1 phases now include HTTP duration/status instrumentation and correlation-aware HTTP events.

They intentionally do not yet add:

- route or Web Vitals telemetry;
- OpenTelemetry SDK/exporter configuration;
- external collectors or monitoring vendors.

Those concerns are introduced by v0.6.1 and v0.6.2.
