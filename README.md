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

The root route redirects to the lazy-loaded architecture example at `/example`.

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

## Current scope

The template currently includes:

- **v0.1 Angular foundation** — strict standalone Angular baseline;
- **v0.2 Architecture** — feature-first boundaries, lazy loading, conventions, and a small reference feature.

HTTP integration, advanced testing, security, observability, CI/CD, and BFF integration are intentionally introduced by later roadmap phases.
