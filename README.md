# Angular Template

A minimal, modern Angular foundation intended to evolve into a reusable GitHub template for production applications.

## Baseline

- Angular 22.2.x
- TypeScript strict mode
- Standalone components
- Angular Router
- SCSS
- npm with a committed `package-lock.json`
- Node.js 24 LTS

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

## Current scope

This repository currently contains only the **v0.1 Angular foundation**:

- strict TypeScript configuration;
- standalone application bootstrap;
- routing foundation;
- SCSS as the default stylesheet language;
- minimal application shell;
- npm scripts for local development, production build, and tests.

Feature architecture, HTTP integration, advanced testing, security, observability, CI/CD, and BFF integration are intentionally introduced by later roadmap phases.
