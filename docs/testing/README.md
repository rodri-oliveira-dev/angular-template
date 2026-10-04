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

Run Playwright E2E tests headless:

```bash
npm run e2e
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

| Metric | Minimum |
| --- | ---: |
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

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

Playwright is configured in `playwright.config.ts` and tests live under `e2e/`.

The default project runs **Chromium headless**. The configuration starts the Angular development server automatically at `http://127.0.0.1:4200`.

The smoke suite covers:

- application bootstrap and root redirect;
- primary navigation availability;
- the reference GET flow;
- the reference POST/write flow.

The reference feature uses the local API mock, so the default E2E suite does not depend on a real backend, cloud service, or network API.

### E2E diagnostics

On failure:

1. rerun the failing test locally with `npm run e2e`;
2. use `npm run e2e:ui` for interactive inspection;
3. inspect `playwright-report/`;
4. inspect traces, screenshots, and videos retained by Playwright when applicable.

Generated Playwright reports and test artifacts are ignored by Git.

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

Broader E2E matrices, visual regression, and CI execution remain opt-in/later concerns. CI integration is introduced in the v0.7 roadmap block.
