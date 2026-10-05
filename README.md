> 🌐 Language: **English** | [Português (Brasil)](README.pt-BR.md)

# Angular Template

[![CI](https://github.com/rodri-oliveira-dev/angular-template/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/rodri-oliveira-dev/angular-template/actions/workflows/ci.yml)
[![CodeQL](https://github.com/rodri-oliveira-dev/angular-template/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/rodri-oliveira-dev/angular-template/actions/workflows/codeql.yml)
[![codecov](https://codecov.io/gh/rodri-oliveira-dev/angular-template/branch/main/graph/badge.svg)](https://codecov.io/gh/rodri-oliveira-dev/angular-template)
[![Angular](https://img.shields.io/badge/Angular-22.2-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/github/license/rodri-oliveira-dev/angular-template)](LICENSE)

Production-ready Angular starter focused on maintainable architecture, secure browser/BFF boundaries, automated quality gates, testing, and observability.

The default development mode uses an in-memory mock, so a fresh checkout runs without a backend, cloud account, database, identity provider, or other external infrastructure.

## Baseline

- Angular 22.2.x
- TypeScript 6.0.x in strict mode
- Node.js 24.15.0+ in the Node 24 line
- standalone Angular APIs and lazy-loaded routes
- feature-first architecture
- SCSS
- npm with committed `package-lock.json`
- Vitest through Angular's native unit-test builder
- Playwright browser tests
- ESLint + Prettier
- coverage gate of 85% for statements, branches, functions, and lines
- CodeQL, Codecov, CodeRabbit, Dependabot, npm audit, and OWASP ZAP
- same-origin optional BFF integration with XSRF support
- vendor-neutral telemetry foundation

The checked-in versions are validated together by CI. Do not force unsupported dependency combinations with `--force` or `--legacy-peer-deps`.

## Quick start

Use the repository's Node.js version:

```bash
nvm use
```

Install exactly the lockfile dependency graph:

```bash
npm ci
```

Start the application:

```bash
npm start
```

Open `http://localhost:4200`.

The default mode uses the local mock and requires no external services.

For a complete first-use walkthrough, see [Getting Started](docs/getting-started.md).

## Use as a GitHub template

After this repository is marked as a **Template repository** in GitHub, create a new repository with **Use this template → Create a new repository**. The generated repository starts with the template files without inheriting this repository's Git history.

The copied project is immediately runnable with `npm ci && npm start`. Project-specific renaming and replacement of the reference feature can be done incrementally without blocking the initial bootstrap.

Repository administrators can follow [Template Repository Setup](docs/template-repository.md) to enable the GitHub setting.

## Runtime modes

### Local mock

```bash
npm start
```

The reference feature uses an in-memory HTTP mock. This is the zero-infrastructure development path and the default experience for a new project.

### Local BFF

```bash
npm run start:bff
```

The browser calls the same-origin `/api` path and the Angular dev server proxies it to `http://localhost:5000` by default.

Angular does not contain downstream/internal service URLs. The BFF owns browser session/authentication concerns, while Angular handles UI state, browser-facing DTO mapping, XSRF header behavior, correlation, and frontend telemetry.

See [BFF](docs/bff/README.md).

## Validation

Run the main checks independently:

```bash
npm run format:check
npm run lint
npm run security:all
npm run test:coverage
npm run coverage:check
npm run build
npm run e2e
```

Run the clean-bootstrap simulation:

```bash
npm run bootstrap:verify
```

Run the complete local verification sequence:

```bash
npm run ci:verify
```

CI additionally serves the production build through the security-header harness and runs the OWASP ZAP baseline.

## Testing

Unit tests:

```bash
npm test
```

Coverage:

```bash
npm run test:coverage
npm run coverage:check
```

Browser tests:

```bash
npm run e2e
```

Run only one browser mode with `npm run e2e:mock` or `npm run e2e:bff`.

See [Testing](docs/testing/README.md).

## Architecture

```text
src/app/
├── core/       # application-wide infrastructure
├── shared/     # reusable presentation and stateless utilities
├── features/   # business capabilities
├── app.config.ts
└── app.routes.ts
```

Feature internals stay inside their capability. Cross-feature imports are rejected by an automated architecture check. Reusable cross-cutting responsibilities belong deliberately in `shared/` or `core/`.

See [Architecture](docs/architecture/README.md) and the [ADR index](docs/adr/README.md).

## HTTP and API

The template includes typed same-origin API configuration, correlation, Problem Details mapping, feature-owned data access, explicit DTO mapping, and a deterministic local mock.

See [HTTP & API](docs/http/README.md).

## Security

The frontend baseline blocks sanitizer bypass APIs, direct Web Storage access, direct script-readable cookie access, and application console logging. Production builds enable Angular `security.autoCsp`. CI runs dependency auditing and OWASP ZAP against the production build.

See [Security](docs/security/README.md) and [SECURITY.md](SECURITY.md).

## Observability

The template provides a vendor-neutral telemetry boundary with local/no-op implementations, sanitized low-cardinality events, global error handling, HTTP telemetry, navigation telemetry, and selected web-performance signals. An OpenTelemetry adapter boundary is available without requiring a collector for local development.

See [Observability](docs/observability/README.md).

## CI/CD and quality

Pull requests to `main` and pushes to `main` validate:

- clean dependency installation;
- formatting;
- lint, architecture, and security guardrails;
- dependency audit;
- unit coverage >= 85%;
- production build;
- clean template bootstrap;
- OWASP ZAP baseline;
- Playwright mock and BFF browser flows;
- CodeQL JavaScript/TypeScript analysis;
- Codecov LCOV upload when configured;
- CodeRabbit repository review policy through `.coderabbit.yaml`.

Dependabot monitors npm and GitHub Actions. Executable Actions are pinned to immutable SHAs.

See [CI/CD](docs/ci/README.md) and [Code Quality](docs/quality/README.md).

## Reference feature

`src/app/features/example` is intentionally small and replaceable. It demonstrates:

- feature-first ownership;
- route lazy loading;
- GET/POST data access;
- DTO mapping;
- local mock mode;
- BFF-compatible same-origin requests;
- Problem Details;
- correlation and XSRF behavior;
- component, HTTP, unit, and browser testing.

A real application can replace the feature after bootstrap while keeping the surrounding architecture and guardrails.

## VS Code

Open:

```bash
code angular-template.code-workspace
```

The workspace recommends Angular, ESLint, Prettier, Playwright, GitHub Actions, YAML, Vitest, and LCOV tooling and provides tasks for the repository commands.

## Documentation

Start with [Documentation](docs/README.md), which indexes:

- getting started;
- architecture and ADRs;
- HTTP/API;
- testing;
- quality;
- security;
- observability;
- CI/CD;
- optional BFF integration;
- template repository administration;
- release notes.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

For vulnerabilities, follow the private-reporting guidance in [SECURITY.md](SECURITY.md) instead of opening a public issue with exploit details.

## Release

The production-ready baseline is **v1.0.0**. See [CHANGELOG.md](CHANGELOG.md) and [v1.0.0 release notes](docs/releases/v1.0.0.md).
