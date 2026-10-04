# Code quality

The template separates static analysis from formatting:

- **ESLint** owns code-quality, Angular, TypeScript, and template rules.
- **Prettier** owns formatting.
- **Feature boundary check** prevents direct imports from one feature into another.

This avoids duplicate or conflicting style rules between the linter and formatter.

## Commands

Run lint and architecture guardrails:

```bash
npm run lint
```

Apply safe ESLint fixes and rerun the architecture check:

```bash
npm run lint:fix
```

Format supported repository files:

```bash
npm run format
```

Verify formatting without changing files:

```bash
npm run format:check
```

## ESLint baseline

The flat config combines:

- ESLint recommended rules;
- typescript-eslint recommended rules;
- angular-eslint recommended TypeScript rules;
- angular-eslint recommended and accessibility template rules.

Component and directive selectors use the `app` prefix.

Stylistic formatting rules are intentionally not duplicated in ESLint. `eslint-config-prettier` is applied last so Prettier remains the single formatting authority.

## Feature import boundary

Files inside `src/app/features/<feature>/` may import:

- code from the same feature;
- `core/`;
- `shared/`;
- third-party packages.

They must not import implementation from another feature directly.

`npm run architecture:check` parses TypeScript imports and fails when a relative import crosses from one feature boundary into another.

If two features need the same abstraction, move the smallest reusable responsibility to `shared/` or `core/` instead of creating feature-to-feature coupling.

## Bundle budgets

Production build budgets remain enforced in `angular.json`:

| Budget | Warning | Error |
| --- | ---: | ---: |
| Initial bundle | 500 kB | 1 MB |
| Any component style | 4 kB | 8 kB |

Budget changes should be explicit and justified in the pull request rather than raised automatically to make a build pass.

## Local quality gate

Before opening or approving a pull request, run:

```bash
npm run format:check
npm run lint
npm run build
npm test
```

Coverage and E2E remain available through `npm run test:coverage` and `npm run e2e`.
