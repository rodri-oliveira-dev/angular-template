# Testing

The template uses Angular's native unit-test builder with **Vitest**. The goal is to test observable behavior with the smallest useful setup, while keeping framework integration tests close to Angular's official testing APIs.

## Commands

Run the unit suite once:

```bash
npm test
```

Equivalent explicit command:

```bash
npm run test:unit
```

Run in watch mode during development:

```bash
npm run test:unit:watch
```

Generate and enforce code coverage:

```bash
npm run test:coverage
```

Coverage reports are written to `coverage/`, including HTML and LCOV output.

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

## What should be tested

Prioritize:

- user-visible behavior;
- mapping between external contracts and feature models;
- request method, URL, body, and relevant headers;
- error and retry-facing behavior;
- routing outcomes;
- cross-cutting infrastructure with observable effects.

Usually avoid:

- private methods directly;
- Angular framework behavior already covered by Angular;
- CSS-only implementation details;
- trivial type/interface declarations;
- assertions that merely repeat a constant with no behavior.

## Scope of v0.4.1

This phase adds coverage gates and repeatable conventions on top of the v0.4 unit-testing foundation.

Playwright and end-to-end smoke tests remain deferred to **v0.4.2**, and CI execution remains deferred to **v0.7.x**.
