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

Performance collection is controlled independently inside telemetry configuration:

```ts
provideTelemetry({
  enabled: true,
  mode: 'local',
  localBufferSize: 100,
  performance: {
    enabled: true,
    navigation: true,
    webVitals: true,
  },
});

providePerformanceTelemetry();
```

Disabling `performance.enabled` prevents router and browser-performance observers from being attached.

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

| Attribute       | Meaning                                                                   |
| --------------- | ------------------------------------------------------------------------- |
| `method`        | HTTP method such as GET or POST                                           |
| `outcome`       | `success`, `error`, or `cancelled`                                        |
| `status`        | HTTP status when available                                                |
| `durationMs`    | client-observed request duration in milliseconds                          |
| `correlationId` | response correlation ID when available, otherwise the outgoing request ID |

The event intentionally omits full URLs/query strings, bodies, headers, cookies, and authentication values.

### Error strategy

The HTTP telemetry interceptor observes failures but does not call `telemetry.error()`.

`httpErrorInterceptor` remains the single place that converts Angular `HttpErrorResponse` into `ApiError`. HTTP telemetry records the normalized result as a structured request event, avoiding duplicate reporting.

## Navigation telemetry

Successful, cancelled, and failed Angular router navigations emit `navigation.completed`.

The event contains:

- `outcome`;
- `durationMs`;
- `routePattern` when a successful route is known.

The route pattern comes from Angular route configuration (for example `/orders/:id`), not the concrete browser URL. This avoids recording route parameters, query strings, fragments, or user-controlled identifiers.

## Selected Web Vitals

When enabled and supported by the browser, the template observes:

- **LCP** — Largest Contentful Paint;
- **CLS** — Cumulative Layout Shift.

The latest LCP value and CLS score are flushed on `pagehide` as `performance.web_vital` events.

CLS follows the standardized maximum session-window model: layout shifts belong to the same window only while consecutive shifts remain less than one second apart and the window remains under five seconds. The emitted CLS value is the maximum window score, not the lifetime sum.

If the browser does not support `layout-shift` observation, the template omits CLS entirely rather than reporting an artificial zero. A supported observer with no qualifying shifts may still legitimately report zero.

The baseline intentionally does not implement a custom INP approximation. If a production application needs the complete evolving Core Web Vitals algorithm, use a maintained Web Vitals/OpenTelemetry integration behind the adapter boundary instead of duplicating browser-vitals algorithms in feature code.

Browsers that do not support a requested `PerformanceObserver` entry type simply skip that metric.

## Optional exporter boundary

`LocalTelemetryClient` accepts an optional `TelemetryExporter`. The default exporter is a no-op, so **no collector is required**.

The repository includes `OpenTelemetryTelemetryExporter`, which adapts sanitized telemetry records to an `OpenTelemetryBridge`:

```ts
const exporter = new OpenTelemetryTelemetryExporter({
  recordEvent: (name, attributes) => {
    // map to the OpenTelemetry API/SDK selected by the host application
  },
  recordError: (name, errorType, attributes) => {
    // map to OpenTelemetry logs or span events
  },
});

provideTelemetry(config, exporter);
```

The adapter deliberately does not import `@opentelemetry/*` packages. This keeps the base template collector-free and prevents components/features from depending on a vendor SDK.

### Connecting an exporter/collector

A production application can:

1. install the OpenTelemetry web packages required by its chosen signal/exporter;
2. configure SDK resources, batching, sampling, and endpoint at the composition root;
3. implement `OpenTelemetryBridge` using that SDK;
4. pass `OpenTelemetryTelemetryExporter` to `provideTelemetry`;
5. keep collector endpoints and environment-specific settings outside feature code.

Collector availability must not be required for application bootstrap. Synchronous exporter failures are isolated at the `LocalTelemetryClient` boundary so telemetry can never turn a successful application operation into a failure. Batching, retries, sampling, and remote-delivery policy still belong in the host application's OpenTelemetry SDK configuration, not in components.

## Local telemetry

`LocalTelemetryClient` keeps only a bounded in-memory buffer and never writes to console, browser storage, cookies, or network endpoints.

Records are sanitized before they are added to the local buffer **and before they are passed to an optional exporter**.

## v0.6 responsibility boundaries

The completed observability block provides:

- vendor-neutral structured telemetry;
- global unexpected-error capture;
- HTTP duration/status/outcome/correlation;
- navigation duration/outcome using safe route patterns;
- selected LCP/CLS telemetry;
- configurable performance collection;
- optional exporter/OpenTelemetry bridge.

It intentionally does not require:

- an OpenTelemetry SDK;
- an exporter package;
- a collector;
- a monitoring vendor.

Feature components remain coupled only to application abstractions, not telemetry SDKs.
