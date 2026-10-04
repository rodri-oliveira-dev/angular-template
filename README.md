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
- **v0.3 HTTP & API integration** — provider-based HTTP, Problem Details, correlation, feature data-access, and local GET/POST examples.

Advanced testing, security, observability, CI/CD, and BFF integration are intentionally introduced by later roadmap phases.
