> 🌐 Language: **English** | [Português (Brasil)](../pt-BR/testing/README.md)

# Testing

The template uses Angular's native unit-test builder with **Vitest** for unit/integration tests and **Playwright** for browser-level end-to-end smoke tests.

The goal is to test observable behavior with the smallest useful setup while keeping framework integration close to official Angular and Playwright APIs.

## Commands

Run the unit suite once:

```bash
npm test
```

Equivalent explicit command:

```bash
npm run test:unit
```

Run unit tests in watch mode:

```bash
npm run test:unit:watch
```

Generate and enforce code coverage:

```bash
npm run test:coverage
```

Run both Playwright E2E modes headless:

```bash
npm run e2e
```

Run only the zero-dependency local-mock flow:

```bash
npm run e2e:mock
```

Run only the BFF-mode contract flow:

```bash
npm run e2e:bff
```

Open Playwright UI mode for local diagnosis:

```bash
npm run e2e:ui
```

Open the last HTML report:

```bash
npm run e2e:report
```

Before the first local E2E run, install Chromium:

```bash
npx playwright install chromium
```

On Linux environments that also need browser system dependencies:

```bash
npx playwright install --with-deps chromium
```

## Coverage policy

The initial global thresholds are intentionally demanding enough to catch regressions without turning the template into a coverage-number exercise:

| Metric     | Minimum |
| ---------- | ------: |
| Statements |     85% |
| Branches   |     85% |
| Functions  |     85% |
| Lines      |     85% |

The bootstrap entry point, test files, and the application composition root are excluded from coverage. Application and feature behavior remain included.

Do not lower thresholds just to make a change pass. Prefer adding meaningful tests. If a threshold genuinely needs to change, document the architectural reason in the PR.

## Testing principles

### Test behavior, not implementation details

Prefer assertions against rendered output, emitted values, requests, navigation results, and public behavior.

Avoid tests that duplicate private implementation line by line or become coupled to internal refactors.

### Standalone components

Configure standalone components through `imports` in `TestBed`.

The reference `BoundaryCard` test demonstrates:

- creating a standalone component;
- setting a signal input with `fixture.componentRef.setInput`;
- asserting rendered behavior.

### Services and data access

Inject services through `TestBed` and exercise their public API.

For HTTP-facing services, use Angular's official `HttpTestingController` and `provideHttpClientTesting`. The `ExampleApiClient` suite demonstrates:

- GET behavior;
- write requests;
- DTO mapping;
- standardized error handling.

Tests must not call real external services.

### HTTP infrastructure

Core HTTP tests verify behavior rather than Angular internals:

- correlation IDs are generated when absent and preserved when supplied;
- Problem Details responses become `ApiError`;
- incompatible error envelopes are not incorrectly narrowed;
- network failures receive a stable fallback message.

Use Angular's HTTP testing APIs for request/response behavior. Do not spin up an HTTP server for unit tests.

### Routing

Use the real Angular Router configuration with `provideRouter` and `RouterTestingHarness` instead of mocking the router.

The application route suite verifies:

- the lazy-loaded feature route;
- root redirects;
- wildcard redirects.

### Fixtures and mock factories

Reusable test data lives in `src/testing/fixtures/`. Prefer small factory functions with sensible defaults and typed overrides instead of copying large object literals across tests.

Reusable test doubles live in `src/testing/mocks/`. A mock factory should:

- return a fresh object per test;
- expose typed Vitest spies;
- provide deterministic default behavior;
- allow a test to override only what matters to that scenario.

Do not create a generic test-data framework or builder hierarchy when a small typed factory is sufficient.

### Component dependencies

Prefer a real dependency when it is small and deterministic. Use a test double when the dependency would introduce network access, nondeterminism, or irrelevant setup.

Keep mocks scoped to the behavior under test.

## End-to-end smoke tests

The local-mock suite is configured in `playwright.config.ts` and lives under `e2e/`. The BFF-mode suite is configured in `playwright.bff.config.ts` and lives under `e2e-bff/`.

Both projects run **Chromium headless**. The mock suite starts Angular at `http://127.0.0.1:4200`; the BFF suite starts the explicit BFF Angular configuration at `http://127.0.0.1:4201`.

Together they cover:

- application bootstrap and root redirect;
- primary navigation availability;
- local-mock GET and POST flows;
- BFF-mode GET and POST flows through the same feature data-access contract;
- outgoing correlation IDs;
- XSRF on same-origin BFF writes;
- Problem Details rendered through the normalized `ApiError` path.

Neither suite calls a real external backend. The mock suite uses the Angular local interceptor; the BFF suite uses Playwright network interception as a deterministic stand-in for the browser-facing BFF contract.

### E2E diagnostics

On failure:

1. rerun the failing test locally with `npm run e2e`;
2. use `npm run e2e:ui` for interactive inspection;
3. inspect `playwright-report/` for the mock suite or `playwright-report-bff/` for BFF mode;
4. inspect traces, screenshots, and videos retained by Playwright when applicable.

Generated Playwright reports and test artifacts are ignored by Git.

In CI, Playwright uses one worker, one retry, a 30-second per-test timeout, and a 5-second assertion timeout. When the CI job fails, the HTML report and test-result artifacts are uploaded for diagnosis and retained for 7 days. Successful runs do not upload these diagnostics.

## What should be tested

Prioritize:

- user-visible behavior;
- mapping between external contracts and feature models;
- request method, URL, body, and relevant headers;
- error and retry-facing behavior;
- routing outcomes;
- cross-cutting infrastructure with observable effects;
- a small number of critical browser-level journeys.

Usually avoid:

- private methods directly;
- Angular framework behavior already covered by Angular;
- CSS-only implementation details;
- trivial type/interface declarations;
- assertions that merely repeat a constant with no behavior;
- duplicating every unit test again in E2E.

## Testing layers

The template now has three deliberate layers:

1. **Unit/component/data-access tests** — fast behavior checks with Vitest and Angular testing utilities.
2. **Coverage gate** — global regression guard over application code.
3. **E2E smoke tests** — a small set of high-value browser journeys with Playwright.

The unit coverage gate and both Chromium E2E modes run in CI. Broader browser matrices and visual regression remain opt-in concerns.

## VS Code Testing and coverage

Open the repository through `angular-template.code-workspace`.

The workspace recommends **Angular Vitest Runner** (`kuradev.angular-vitest-runner`) because the project uses Angular CLI's `@angular/build:unit-test` builder. The extension discovers `*.spec.ts` files and executes them through `ng test`, preserving Angular's own test pipeline.

Use the VS Code **Testing** view to:

- run the full suite;
- run a single spec;
- run an individual test/suite where supported;
- debug tests from the editor/Test Explorer.

The workspace passes `--watch=false` to Test Explorer runs so one-shot executions terminate cleanly.

### Coverage inside VS Code

The Angular test target already emits LCOV:

```json
"coverageReporters": ["html", "lcov", "text-summary", "json-summary"]
```

Generate it with:

```bash
npm run test:coverage
```

or run the workspace task **test: coverage**.

The recommended **Code Coverage LCOV** extension (`rherrmannr.code-coverage-lcov`) is preconfigured to read:

```text
coverage/lcov.info
```

The workspace enables:

- inline coverage highlighting;
- gutter coverage markers;
- branch coverage visualization.

Coverage thresholds are 85% for statements, branches, functions, and lines. Angular enforces the configured thresholds during test execution, and the separate `coverage:check` command validates `coverage-summary.json` against the explicit 85% workflow gate. The VS Code extension remains a visualization layer and does not replace either gate.
