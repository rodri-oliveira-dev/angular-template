# Continuous Integration

The repository uses GitHub Actions for the baseline pull-request and main-branch quality gate.

## Workflow

The permanent workflow is `.github/workflows/ci.yml`.

It runs for:

- pull requests targeting `main`;
- pushes to `main`.

The baseline CI intentionally contains only the v0.7 gates:

1. install the committed dependency graph with `npm ci`;
2. verify formatting;
3. run ESLint plus architecture/security source guardrails;
4. run unit tests;
5. produce a production build.

Coverage and Playwright E2E are introduced in v0.7.1. Dependabot and CodeQL are introduced in v0.7.2.

## Runtime

CI uses:

- Ubuntu GitHub-hosted runner;
- Node.js 24.15.0;
- npm cache keyed from `package-lock.json`;
- `actions/checkout@v7`;
- `actions/setup-node@v7`.

The checkout does not persist Git credentials because the validation job only needs read access.

## Permissions

The workflow declares:

```yaml
permissions:
  contents: read
```

No write permissions are required for the baseline validation job.

If a future workflow needs additional permissions, grant them to the smallest applicable job rather than widening the repository-wide workflow token.

## Concurrency

Only the latest validation for the same pull request or branch is kept active:

```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

This prevents superseded commits from consuming runner time while preserving independent runs for different PRs.

## Local equivalent

Start from a clean dependency installation:

```bash
npm ci
```

Then run the same gates in the same order:

```bash
npm run format:check
npm run lint
npm test
npm run build
```

Or use the convenience command:

```bash
npm run ci:base
```

The convenience command assumes dependencies are already installed. For CI parity after lockfile or dependency changes, run `npm ci` first.

## Failure diagnosis

Each gate is a separate named workflow step so the failing responsibility is immediately visible in GitHub Actions.

- **Install dependencies** — lockfile/dependency/runtime problem.
- **Format check** — repository contains files not normalized by Prettier.
- **Lint and guardrails** — ESLint, feature-boundary, or frontend-security source policy failure.
- **Unit tests** — behavior or Angular test compilation failure.
- **Production build** — Angular compilation, bundle budget, or production build failure.

The workflow also prints Node and npm versions before executing gates so runtime differences are visible in logs.

Do not hide a failing gate with `continue-on-error`. Fix the underlying problem or explicitly change the repository policy in a reviewed pull request.
