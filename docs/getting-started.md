# Getting Started

## 1. Create or clone

When the upstream repository is enabled as a GitHub Template Repository, prefer **Use this template → Create a new repository**. A normal clone also works for template development.

## 2. Select the runtime

The repository pins Node.js in `.nvmrc`:

```bash
nvm use
```

The v1.0 baseline is validated with Node.js 24.15.0+, Angular 22.2.x, and TypeScript 6.0.x.

## 3. Install

```bash
npm ci
```

A clean install must succeed without `--force`, `--legacy-peer-deps`, or peer-dependency overrides.

## 4. Run without external infrastructure

```bash
npm start
```

The default development configuration replaces runtime API configuration with the local mock configuration. The reference feature therefore runs without a backend, database, cloud resource, identity provider, or BFF.

Open `http://localhost:4200`.

## 5. Validate the template

```bash
npm run bootstrap:verify
npm run ci:verify
```

`bootstrap:verify` copies the template into a fresh temporary directory, runs a clean dependency installation, and verifies a production build from that isolated copy.

`ci:verify` runs the local quality/security/testing/build/bootstrap/browser sequence.

## 6. Optional BFF mode

When a local BFF is available:

```bash
npm run start:bff
```

Browser calls remain same-origin under `/api`; the development proxy forwards them to `http://localhost:5000` by default.

See [BFF](bff/README.md) before changing authentication, cookies, XSRF, CORS, or downstream topology.

## 7. Customize for a real application

The repository is functional before customization. Typical first changes are:

1. update the package/project display identity for your product;
2. replace the reference `features/example` capability with the first real feature;
3. keep or adapt the architecture/security/testing guardrails intentionally;
4. replace the local mock contract with product-specific endpoints;
5. configure the deployment-time BFF/reverse proxy without exposing downstream URLs to Angular;
6. update repository ownership, security-reporting, and contribution policies for your organization.

The reference feature is a working example, not a required business dependency.
