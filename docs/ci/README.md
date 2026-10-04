# Continuous Integration

The repository uses GitHub Actions for the pull-request and main-branch quality gate.

## Workflow

The permanent workflow is `.github/workflows/ci.yml`.

It runs for:

- pull requests targeting `main`;
- pushes to `main`.

The v0.7.1 CI gate executes:

1. install the committed dependency graph with `npm ci`;
2. verify formatting;
3. run ESLint plus architecture/security source guardrails;
4. run the unit suite with coverage enabled;
5. enforce the coverage thresholds from `angular.json`;
6. produce a production build;
7. install the Chromium browser and Linux dependencies required by the lockfile-pinned Playwright version;
8. run the Playwright smoke suite headless.

Dependabot and CodeQL are introduced in v0.7.2.

## Runtime

CI uses:

- Ubuntu GitHub-hosted runner;
- Node.js 24.15.0;
- npm cache keyed from `package-lock.json`;
- `actions/checkout@v7`;
- `actions/setup-node@v7`;
- Chromium installed through the project's Playwright CLI.

Because dependencies are installed with `npm ci`, the Playwright CLI version comes from the committed lockfile. Browser installation therefore follows the Playwright version resolved for the repository.

The checkout does not persist Git credentials because the validation job only needs read access.

## Permissions

The workflow declares:

```yaml
permissions:
  contents: read
```

No write permissions are required for validation or diagnostic artifact upload.

If a future workflow needs additional permissions, grant them to the smallest applicable job rather than widening the workflow token.

## Concurrency

Only the latest validation for the same pull request or branch is kept active:

```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

This prevents superseded commits from consuming runner time while preserving independent runs for different PRs.

## Coverage gate

CI runs:

```bash
npm run test:coverage
```

This runs the unit suite and applies the thresholds already configured in `angular.json`:

| Metric | Minimum |
| --- | ---: |
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

A threshold violation exits non-zero and fails CI. The workflow does not maintain a second set of threshold values.

## Playwright in CI

CI installs the browser and required Linux system libraries with:

```bash
npx playwright install --with-deps chromium
```

Then it runs:

```bash
npm run e2e
```

Playwright configuration keeps CI deliberately strict:

- headless Chromium;
- one worker in CI;
- one retry in CI, zero retries locally;
- 30-second per-test timeout;
- 5-second assertion timeout;
- `forbidOnly` enabled in CI;
- traces on the first retry;
- screenshots only on failure;
- video retained on failure.

One retry provides diagnostic evidence for a transient failure without silently normalizing repeated flakiness. A test that fails again still fails the pipeline and should be investigated.

## Failure diagnostics

Each gate is a separate named workflow step so the failing responsibility is immediately visible.

- **Install dependencies** — lockfile/dependency/runtime problem.
- **Format check** — repository contains files not normalized by Prettier.
- **Lint and guardrails** — ESLint, feature-boundary, or frontend-security source policy failure.
- **Unit tests with coverage** — unit behavior, Angular test compilation, or coverage threshold failure.
- **Production build** — Angular compilation, bundle budget, or production build failure.
- **Install Playwright Chromium** — browser/system dependency installation failure.
- **Playwright E2E** — browser-level smoke regression or flakiness.

When the job fails, CI uploads `playwright-report/` and `test-results/` as a diagnostic artifact **only if those files exist**. Successful runs do not retain Playwright artifacts.

The diagnostic artifact is retained for 7 days.

## Local equivalent

Start from a clean dependency installation:

```bash
npm ci
```

Install Chromium once when necessary:

```bash
npx playwright install chromium
```

On Linux environments that also need system dependencies:

```bash
npx playwright install --with-deps chromium
```

Run the CI-equivalent application gates:

```bash
npm run format:check
npm run lint
npm run test:coverage
npm run build
npm run e2e
```

Or, after dependencies/browser prerequisites are installed:

```bash
npm run ci:verify
```

`npm run ci:base` remains available for the original v0.7 format/lint/unit/build baseline.

Do not hide a failing gate with `continue-on-error`. Fix the underlying problem or explicitly change repository policy in a reviewed pull request.
