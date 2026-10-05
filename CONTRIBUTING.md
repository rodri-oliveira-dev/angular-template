> 🌐 Language: **English** | [Português (Brasil)](CONTRIBUTING.pt-BR.md)

# Contributing

Contributions are welcome when they preserve the repository's role as a reusable Angular template rather than adding application-specific product behavior.

## Prerequisites

- Node.js 24.15.0+ in the Node 24 line
- npm
- Chromium installed through Playwright for browser tests

Use the checked-in runtime:

```bash
nvm use
npm ci
```

Do not use `--force` or `--legacy-peer-deps` to bypass peer-dependency conflicts.

## Development

The zero-infrastructure development path is:

```bash
npm start
```

Use BFF mode only when validating that integration boundary:

```bash
npm run start:bff
```

## Before opening a pull request

Run:

```bash
npm run ci:verify
```

At minimum, a PR must keep formatting, lint/architecture/security guardrails, dependency auditing, tests, coverage, production build, clean bootstrap, and browser tests green.

Coverage thresholds are 85% for statements, branches, functions, and lines. Bundle-budget increases must be justified rather than used to hide regressions.

## Architecture expectations

- keep business capabilities inside `features/<feature>`;
- do not import another feature's internals;
- reserve `core/` for application-wide infrastructure;
- reserve `shared/` for genuinely reusable presentation/stateless code;
- keep browser-facing API configuration same-origin by default;
- do not put secrets, access tokens, refresh tokens, or session identifiers in client configuration or Web Storage.

See `docs/architecture`, `docs/security`, and `docs/bff` before changing those boundaries.

## Pull requests

Keep PRs focused and explain:

- what changed and why;
- architectural/security impact;
- tests added or changed;
- documentation impact;
- any intentional budget, dependency, or compatibility change.

Resolve review threads before merge. The CI status comment on the PR identifies the gate that failed and links to the workflow run.

## Dependency updates

Compatible patch/minor updates may be handled by Dependabot. Major toolchain upgrades should be deliberate and must respect the official compatibility ranges of Angular, TypeScript, Node.js, and the lint/build toolchain.

## Documentation

Update documentation in the same PR when behavior, commands, supported versions, security boundaries, or operational expectations change.
