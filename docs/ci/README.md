> 🌐 Language: **English** | [Português (Brasil)](../pt-BR/ci/README.md)

# Continuous Integration

The repository uses GitHub Actions as the quality gate for pull requests and for the `main` branch.

## Packaged Schematics validation

Pull-request CI has a separate `Packaged Schematics consumer` job. It installs only the collection
toolchain, runs virtual-tree tests, inspects and clean-installs the exact `npm pack` archive, then
generates a temporary application through the installed package and runs its full quality,
coverage, build, bootstrap, mock E2E, and BFF E2E gates. Temporary output is outside the checkout
and is removed in `finally` on success or failure.

`.github/workflows/publish-schematics.yml` is independent of ordinary branch CI. It accepts only a
version tag whose value matches `schematics/package.json`, runs only in the canonical repository,
repeats package/consumer validation, and publishes through npm trusted publishing with OIDC. See
[Angular Schematics distribution](../schematics.md#release-and-publish).

## Workflow

The permanent workflow is `.github/workflows/ci.yml`.

It runs on:

- pull requests targeting `main`;
- pushes to `main`.

The CI gate:

1. installs the committed dependency graph with `npm ci`;
2. verifies formatting;
3. runs ESLint plus architecture, frontend-security, and documentation-localization guardrails;
4. runs the security scanner tests and `npm audit --audit-level=high`;
5. runs the unit suite with coverage;
6. uploads `coverage/angular-template/lcov.info` to Codecov when that integration is configured;
7. applies the explicit 85% coverage gate against `coverage/coverage-summary.json`;
8. produces a production build;
9. validates a clean template bootstrap from an isolated copy;
10. serves the production build through the security-header harness;
11. runs OWASP ZAP Baseline;
12. installs Chromium and the Linux dependencies required by the lockfile-pinned Playwright version;
13. runs the Playwright mock and BFF smoke suites headless.

Dependabot, CodeQL, Codecov, and CodeRabbit complement the main CI gate.

## Runtime

CI uses:

- an Ubuntu GitHub-hosted runner;
- Node.js 24.15.0;
- npm cache keyed from `package-lock.json`;
- SHA-pinned `actions/checkout@v7`;
- SHA-pinned `actions/setup-node@v7`;
- Chromium installed through the project's Playwright CLI.

Because dependencies are installed with `npm ci`, the Playwright CLI version comes from the committed lockfile. Browser installation therefore follows the Playwright version resolved for the repository.

Checkout uses `persist-credentials: false` because validation does not need persistent Git credentials.

## Permissions

The CI workflow grants:

```yaml
permissions:
  contents: read
  issues: write
  pull-requests: write
  id-token: write
```

`contents: read` is sufficient for source validation. The issue/PR write permissions are used only by the sticky CI status comment that reports the failed or passed gates on pull requests.

If a future workflow needs additional permissions, grant them at the smallest practical scope rather than widening the token unnecessarily.

## Concurrency

Only the latest validation for the same pull request or branch remains active:

```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

This prevents superseded commits from consuming runner time while preserving independent runs for different pull requests.

## Coverage gate

CI runs:

```bash
npm run test:coverage
```

The thresholds configured in `angular.json` are:

| Metric     | Minimum |
| ---------- | ------: |
| Statements |     85% |
| Branches   |     85% |
| Functions  |     85% |
| Lines      |     85% |

Then CI runs `npm run coverage:check`.

The gate reads `coverage/coverage-summary.json`, validates all four metrics independently, and verifies that the Angular thresholds have not been lowered below repository policy. Any metric below 85% fails CI.

## Codecov

After unit coverage is generated, CI uploads `coverage/lcov.info` with the official Codecov GitHub Action. The Action is pinned to an immutable SHA, following the same supply-chain policy as the other executable Actions.

The repository-level `codecov.yml` keeps overall project coverage aligned with the local 85% gate and reports patch coverage as informational.

Codecov authentication uses GitHub OIDC, so no long-lived `CODECOV_TOKEN` secret is required. The workflow grants `id-token: write` only so the official Codecov Action can request a short-lived OIDC token.

To enable Codecov on a repository created from this template:

1. install/authorize the Codecov GitHub App for the repository;
2. configure the repository in Codecov;
3. keep the checked-in OIDC configuration.

The upload remains non-blocking by default so a newly generated repository does not fail CI before Codecov has been authorized. Teams that require Codecov as a mandatory external gate can change `fail_ci_if_error` to `true` after the GitHub App is active.

The local `coverage:check` gate remains authoritative and always runs independently of Codecov availability.

## Playwright in CI

CI installs the browser and required Linux libraries with:

```bash
npx playwright install --with-deps chromium
```

Then it runs:

```bash
npm run e2e
```

The configuration keeps browser validation deliberately strict:

- headless Chromium;
- one worker in CI;
- one retry in CI and zero retries locally;
- 30-second per-test timeout;
- 5-second assertion timeout;
- `forbidOnly` enabled in CI;
- traces on the first retry;
- screenshots on failure;
- video retained on failure.

One retry provides diagnostic evidence for a transient failure without normalizing repeated flakiness.

## Failure diagnostics

Each responsibility is a named workflow step.

- **Install dependencies** — lockfile, dependency, or runtime problem.
- **Format check** — files are not normalized by Prettier.
- **Lint and guardrails** — ESLint, feature boundary, frontend-security source policy, or bilingual-documentation policy failed.
- **Security guardrails and dependency audit** — security scanner or dependency advisory failed.
- **Unit tests with coverage** — unit behavior or Angular test compilation failed.
- **Coverage gate (>= 85%)** — a coverage metric is below policy or an Angular threshold was lowered.
- **Production build** — Angular compilation, bundle budget, or production build failed.
- **Clean template bootstrap** — the template cannot install/build from an isolated clean copy.
- **Serve production build for DAST** — the security-header harness did not start.
- **OWASP ZAP baseline** — an unaccepted DAST alert was found.
- **Install Playwright Chromium** — browser/system dependency installation failed.
- **Playwright E2E** — browser-level mock/BFF regression or repeated flakiness.

When the job fails, CI uploads Playwright diagnostics only when those files exist. Successful runs do not retain those failure artifacts. Diagnostic artifacts are retained for 7 days.

The workflow also maintains one sticky PR comment with the CI result. It lists actual failed gates separately from steps skipped after a failure and links to the workflow run.

## Local equivalent

Start with a clean dependency install:

```bash
npm ci
```

Install Chromium when necessary:

```bash
npx playwright install chromium
```

On Linux environments that also need browser system dependencies:

```bash
npx playwright install --with-deps chromium
```

Run the gates:

```bash
npm run format:check
npm run lint
npm run security:all
npm run test:coverage
npm run coverage:check
npm run build
npm run bootstrap:verify
npm run e2e
```

Or:

```bash
npm run ci:verify
```

`npm run ci:base` remains available as a lightweight format/lint/unit/build baseline.

Do not hide a failing gate with `continue-on-error`. Fix the underlying problem or explicitly change repository policy in a reviewed pull request.

## CodeRabbit

The repository includes `.coderabbit.yaml` tuned for Angular/TypeScript review.

The configuration:

- produces review feedback in Brazilian Portuguese;
- uses an assertive profile while avoiding formatting-only noise already covered by Prettier;
- disables CodeRabbit's ESLint duplication because ESLint is already a mandatory CI gate;
- enables workflow/security-oriented tools such as actionlint, zizmor, ShellCheck, and secret scanning;
- applies path-specific review instructions for Angular source, templates, BFF/security boundaries, GitHub Actions, scripts, toolchain files, and bilingual documentation;
- enables automatic reviews for pull requests targeting `main`.

CodeRabbit is repository automation, not a runtime dependency. Install/authorize the CodeRabbit GitHub App for repositories that should receive automated reviews.

## Dependency automation

Dependabot is configured in `.github/dependabot.yml` for npm and GitHub Actions.

Both ecosystems run weekly. To reduce pull-request noise:

- npm minor/patch updates are grouped when compatible;
- GitHub Actions updates are grouped;
- npm major updates remain separate for explicit compatibility review;
- each ecosystem limits open version-update pull requests.

Dependabot updates the committed dependency/Action references; normal CI and CodeQL checks still decide whether an update is safe to merge.

## CodeQL

`.github/workflows/codeql.yml` analyzes JavaScript/TypeScript with GitHub CodeQL advanced setup.

It runs on:

- pull requests targeting `main`;
- pushes to `main`;
- a weekly schedule.

JavaScript/TypeScript uses `build-mode: none`, so security analysis is independent from the Angular production build covered by CI.

The CodeQL workflow grants only the permissions required to read source and publish security analysis.

## GitHub Action pinning

Executable Actions are pinned to immutable full commit SHAs, with the corresponding release version kept as an inline comment:

```yaml
uses: actions/checkout@<full-commit-sha> # v7.0.1
```

This prevents a mutable tag from changing the code executed by an existing workflow revision.

Dependabot monitors the `github-actions` ecosystem and proposes updated pins through normal pull requests.

When adding an Action:

1. prefer GitHub-owned or otherwise well-maintained Actions;
2. select a stable release;
3. resolve the release tag to its full commit SHA;
4. pin the workflow to that SHA;
5. retain the human-readable version in a comment;
6. let Dependabot maintain subsequent updates.

Do not replace a SHA pin with a floating branch such as `main`.

## Recommended branch protection / ruleset

For `main`, configure a ruleset or branch-protection rule that requires pull requests and the repository checks.

Recommended required checks:

- **CI / Quality, coverage, E2E & build**;
- **CodeQL / JavaScript / TypeScript**.

Also recommended:

- require the branch to be up to date when stale validation is a material risk;
- require approval when appropriate for the maintenance model;
- dismiss stale approvals after material code changes;
- require conversation resolution;
- block force pushes and branch deletion;
- allow bypass only for explicitly trusted maintainers/automation.

Rulesets are repository governance state rather than application source, so the template documents the policy instead of trying to mutate repository administration automatically.

## Clean template bootstrap

CI includes `npm run bootstrap:verify`. It copies the repository into a fresh temporary directory while excluding generated artifacts and repository metadata, then performs:

```bash
npm ci
npm run build
```

This validates that a consumer can start from template files alone with the committed lockfile. Runtime independence from external infrastructure is validated separately by the mock-mode Playwright suite.

The pull-request CI reporter includes **Clean template bootstrap** as an explicit gate.
