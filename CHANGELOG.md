> 🌐 Language: **English** | [Português (Brasil)](CHANGELOG.pt-BR.md)

# Changelog

All notable changes to the production-ready template are documented here.

## [1.0.0] - 2026-10-05

### Added

- strict standalone Angular 22 foundation with feature-first architecture;
- typed HTTP/API integration with Problem Details and correlation;
- local zero-infrastructure mock mode and optional same-origin BFF mode;
- BFF session/XSRF browser contract and reference integration tests;
- Vitest unit tests, Playwright E2E, typed test fixtures, and 85% coverage gates;
- ESLint, Prettier, architecture boundaries, frontend security guardrails, npm audit, CodeQL, Dependabot, and OWASP ZAP;
- vendor-neutral telemetry, HTTP/navigation/performance telemetry, and OpenTelemetry adapter boundary;
- GitHub Actions CI with PR status reporting and failure diagnostics;
- VS Code workspace, tasks, debugging, testing, and coverage integration;
- clean-template bootstrap validation;
- contributing, security, issue/PR templates, ADR index, documentation index, and release documentation.

### Changed

- project metadata promoted to v1.0.0;
- documentation consolidated around production/template usage rather than roadmap phase labels;
- stale pre-BFF/future-phase wording removed.

### Deferred

- TypeScript 7 migration remains blocked until the Angular/build/lint toolchain officially supports it;
- npm/Angular Schematics distribution is planned as a post-v1.0 evolution.
