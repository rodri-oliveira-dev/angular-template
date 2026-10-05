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

| Mode | Purpose | API base path |
| --- | --- | --- |
| `mock` | zero-dependency local development | `/api` |
| `bff` | real BFF connectivity | `/api` by default |

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

## Deliberately not included yet

This phase does not add:

- authentication/session cookies;
- XSRF handling;
- `withCredentials`;
- refresh/session lifecycle;
- .NET BFF implementation;
- final reference feature contracts.

Session security and XSRF belong to v0.8.1.
