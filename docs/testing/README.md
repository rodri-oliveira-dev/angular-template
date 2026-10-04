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

### Routing

Use the real Angular Router configuration with `provideRouter` and `RouterTestingHarness` instead of mocking the router.

The application route suite verifies:

- the lazy-loaded feature route;
- root redirects;
- wildcard redirects.

### Component dependencies

Prefer a real dependency when it is small and deterministic. Use a test double when the dependency would introduce network access, nondeterminism, or irrelevant setup.

Keep mocks scoped to the behavior under test.

## Scope of v0.4

This phase establishes the unit-testing foundation only.

The following are intentionally deferred:

- coverage thresholds and fixture conventions to **v0.4.1**;
- Playwright and end-to-end smoke tests to **v0.4.2**;
- CI execution to **v0.7.x**.
