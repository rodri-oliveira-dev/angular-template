> 🌐 Language: **English** | [Português (Brasil)](CHANGELOG.pt-BR.md)

# Changelog

All notable changes to the production-ready template are documented here.

## [1.1.0] - 2026-10-05

### Added

- standalone `@rodri/angular-template` Angular Schematics collection;
- `ng new <name> --collection=@rodri/angular-template` generation composed with official Angular
  CLI schematics;
- deterministic mock/BFF, styles, routing, observability, E2E, proxy, and coverage options;
- virtual-tree unit tests and packed clean-room generated-project validation;
- minimal npm tarball inspection and tag-gated trusted-publishing workflow with provenance;
- bilingual installation, option, development, packaging, and release documentation.

### Changed

- npm/Schematics is the recommended project-creation route; GitHub Template remains a fallback;
- generated identity, paths, lockfile metadata, workspace configuration, and CI coverage paths are
  normalized to the requested project name.

### Security

- release automation uses GitHub OIDC/npm trusted publishing and commits no npm token;
- generation rejects credential-bearing BFF targets and output paths outside the working directory.

## [1.0.0] - 2026-10-05

### Added

- strict standalone Angular 22 foundation with feature-first architecture;
- typed HTTP/API integration with Problem Details and correlation;
- local zero-infrastructure mock mode and optional same-origin BFF mode;
- BFF session/XSRF browser contract and reference integration tests;
- Vitest unit tests, Playwright E2E, typed test fixtures, and 85% coverage gates;
- ESLint, Prettier, architecture boundaries, frontend security guardrails, npm audit, CodeQL, Codecov with OIDC, CodeRabbit, Dependabot, and OWASP ZAP;
- vendor-neutral telemetry, HTTP/navigation/performance telemetry, and OpenTelemetry adapter boundary;
- GitHub Actions CI with PR status reporting and failure diagnostics;
- VS Code workspace, tasks, debugging, testing, and coverage integration;
- clean-template bootstrap validation;
- bilingual English/pt-BR documentation with language selectors and an automated localization-pair guardrail;
- CI, CodeQL, Codecov, toolchain, and license badges in the README;
- contributing, security, issue/PR templates, ADR index, documentation index, and release documentation.

### Changed

- project metadata promoted to v1.0.0;
- documentation consolidated around production/template usage rather than roadmap phase labels;
- stale pre-BFF/future-phase wording removed.

### Deferred

- TypeScript 7 migration remains blocked until the Angular/build/lint toolchain officially supports it;
- npm/Angular Schematics distribution was delivered in v1.1.0.
