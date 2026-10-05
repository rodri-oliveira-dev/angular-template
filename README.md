# Angular Template

A modern Angular foundation intended to evolve into a reusable GitHub template for production applications.

## Baseline

- Angular 22.2.x
- TypeScript strict mode
- Standalone components
- Angular Router
- SCSS
- npm with a committed `package-lock.json`
- Node.js 24 LTS
- Feature-first architecture with lazy-loaded feature entry points
- Provider-based `HttpClient` with typed API configuration
- Angular native unit-test builder with Vitest
- ESLint + Prettier quality baseline
- Vendor-neutral telemetry foundation

## Prerequisites

Use Node.js **24.15.0 or later in the Node 24 LTS line**. The repository includes an `.nvmrc` file:

```bash
nvm use
```

Verify your environment:

```bash
node --version
npm --version
```

## VS Code workspace

The repository includes `angular-template.code-workspace` with the recommended development setup.

Open it directly:

```bash
code angular-template.code-workspace
```

The workspace provides:

- Angular, ESLint, Prettier, EditorConfig, Playwright, GitHub Actions, and YAML extension recommendations;
- format-on-save and ESLint fix-on-save aligned with the repository quality rules;
- workspace TypeScript from `node_modules`;
- tasks for install, serve, build, unit tests, coverage, lint, formatting, security, Playwright, and full CI verification;
- **Angular: Debug in Chrome**, which starts the Angular dev server automatically;
- **Angular: Attach to Chrome** for an existing remote-debugging session;
- **Playwright: Debug E2E** for interactive browser-test debugging.

Use **Terminal → Run Task** for the predefined tasks and **Run and Debug** for the launch configurations.

## Install

Install exactly the dependency graph recorded in the lockfile:

```bash
npm ci
```

## Run locally

```bash
npm start
```

The Angular development server is available at `http://localhost:4200`.

The root route redirects to the lazy-loaded reference feature at `/example`. Its HTTP example uses a local in-memory mock by default, so no external backend is required.

## Build

Production build:

```bash
npm run build
```

Development watch mode:

```bash
npm run watch
```

## Test

Run the unit test suite once:

```bash
npm test
```

Run explicitly:

```bash
npm run test:unit
```

Generate coverage with enforced thresholds:

```bash
npm run test:coverage
```

Watch mode:

```bash
npm run test:unit:watch
```

Run the Playwright smoke suite:

```bash
npm run e2e
```

The test foundation includes standalone component, service/data-access, HTTP, interceptor, routing, and browser-level smoke examples. Coverage gates enforce 80% statements/lines/functions and 75% branches. See [Testing](docs/testing/README.md).

## Continuous integration

Pull requests to `main` and pushes to `main` run the GitHub Actions CI gate:

```bash
npm ci
npm run format:check
npm run lint
npm run test:coverage
npm run build
npx playwright install --with-deps chromium
npm run e2e
```

After dependencies and the browser are installed, use `npm run ci:verify` for the equivalent application gates locally. `npm run ci:base` remains available for the original v0.7 baseline.

Dependabot monitors npm and GitHub Actions, and CodeQL analyzes JavaScript/TypeScript on PRs, main, and a weekly schedule. Executable Actions are pinned to immutable commit SHAs.

See [Continuous Integration](docs/ci/README.md) for triggers, permissions, concurrency, dependency automation, CodeQL, Action pinning, branch protection, and failure diagnosis.

## Code quality

Run static analysis and architecture guardrails:

```bash
npm run lint
```

Check repository formatting:

```bash
npm run format:check
```

Apply formatter output with `npm run format` and safe linter fixes with `npm run lint:fix`.

See [Code quality](docs/quality/README.md) for lint rules, feature-boundary checks, and bundle budgets.

## Frontend security

Run the frontend security guardrails:

```bash
npm run security:check
npm run security:test
npm run security:audit
```

The baseline blocks sanitizer bypass APIs, direct Web Storage access, direct script-readable cookie access, and console logging in application TypeScript. Client-side configuration is treated as public and must never contain secrets.

Production builds also enable Angular `security.autoCsp`, and the repository includes provider-neutral response-header guidance plus a High/Critical dependency-audit gate.

See [Frontend security](docs/security/README.md) for sanitization, storage, cookies, dependency policy, CSP, CORS, and browser-header guidance.

## Observability

The template provides a vendor-neutral `TelemetryClient` with local and no-op implementations plus a global Angular `ErrorHandler` adapter.

The local implementation keeps only sanitized, bounded in-memory records. It does not write telemetry to console, browser storage, or an external collector. HTTP, Angular navigation, LCP, and CLS telemetry are configurable and use low-cardinality/sanitized attributes. An optional exporter boundary can be bridged to OpenTelemetry without making an SDK or collector mandatory.

See [Observability](docs/observability/README.md) for configuration, error handling, and sensitive-data rules.

## Architecture

The application is organized around feature ownership:

```text
src/app/
├── core/       # application-wide infrastructure
├── shared/     # reusable presentation and stateless utilities
├── features/   # business capabilities
├── app.config.ts
└── app.routes.ts
```

A feature may use:

```text
features/<feature>/
├── pages/
├── components/
├── data-access/
└── models/
```

Top-level features should prefer lazy loading. Do not import another feature's internals directly; promote genuinely cross-cutting code to `shared/` or `core/` deliberately.

See [Architecture](docs/architecture/README.md) and [ADR 0001](docs/adr/0001-feature-first-architecture.md) for the detailed rationale and dependency rules.

## HTTP and API integration

The template provides:

- typed API base-path configuration;
- functional correlation and error interceptors;
- Problem Details mapping to a standardized `ApiError`;
- feature-owned data-access services;
- explicit DTO mapping;
- loading/error state and lifecycle-aware request subscriptions;
- a local mock demonstrating GET and POST without external infrastructure.

See [HTTP and API integration](docs/http/README.md) for endpoint conventions and integration guidance.

## Current scope

The template currently includes:

- **v0.1 Angular foundation** — strict standalone Angular baseline;
- **v0.2 Architecture** — feature-first boundaries, lazy loading, conventions, and a small reference feature;
- **v0.3 HTTP & API integration** — provider-based HTTP, Problem Details, correlation, feature data-access, and local GET/POST examples;
- **v0.4 Unit testing foundation** — Vitest runner conventions and examples for components, services/data-access, HTTP, and routing;
- **v0.4.1 Coverage & test conventions** — reproducible coverage gates plus typed fixtures and mock factories;
- **v0.4.2 Playwright E2E** — headless Chromium smoke tests for bootstrap, navigation, and the reference flow;
- **v0.5 Code quality baseline** — ESLint, Prettier, bundle budgets, and feature import guardrails;
- **v0.5.1 Frontend security baseline** — sanitization, browser storage, cookie, logging, and public client-config guardrails;
- **v0.5.2 Dependency & browser security hardening** — dependency audit policy, Angular autoCSP, browser response headers, CORS guidance, and secure-cookie hardening;
- **v0.6 Telemetry foundation** — vendor-neutral structured telemetry, local/no-op providers, sanitization, and global error reporting;
- **v0.6.1 HTTP telemetry & correlation** — request duration/status/outcome events, correlation handling, and single-path HTTP failure reporting;
- **v0.6.2 Performance telemetry & OpenTelemetry adapter** — safe route navigation telemetry, selected LCP/CLS metrics, configurable collection, and an optional collector-free exporter bridge;
- **v0.7 CI foundation** — PR/main GitHub Actions gate for formatting, lint/guardrails, unit tests, and production build;
- **v0.7.1 Coverage & E2E in CI** — enforced coverage thresholds, reproducible Chromium installation, headless Playwright smoke tests, and failure-only diagnostics;
- **v0.7.2 Dependency automation & CodeQL** — grouped Dependabot updates, JavaScript/TypeScript CodeQL scanning, immutable Action pins, and documented main-branch protection.

The v0.7 CI/CD block is complete. BFF integration remains the next functional roadmap block.
