# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
| < 1.0   | No        |

Security fixes are applied to the current supported line. Consumers of a generated project are responsible for maintaining their own dependencies and deployment controls after creation.

## Reporting a vulnerability

Do not open a public issue containing exploit details, credentials, sensitive logs, or a proof of concept for an unpatched vulnerability.

Prefer GitHub's private vulnerability reporting/security-advisory flow for this repository when available:

1. open the repository **Security** tab;
2. use the private reporting/advisory option;
3. include the affected version, impact, reproduction steps, and a minimal proof of concept;
4. remove secrets and unrelated personal data.

If private reporting is unavailable, contact the repository maintainer through a private channel before publishing technical exploit details.

## Scope

Security reports are especially useful for:

- Angular/client-side injection or unsafe DOM handling;
- authentication/session/XSRF boundary defects in the documented BFF contract;
- accidental credential persistence or logging;
- dependency or CI supply-chain weaknesses;
- security-header or CSP regressions;
- code-generation/template behavior that creates an unsafe default.

Application-specific backend authorization, identity-provider configuration, cloud infrastructure, and downstream service security remain responsibilities of the application built from this template.

## Disclosure

Please allow maintainers time to validate and prepare a fix before public disclosure. Once a fix is available, release notes should describe impact and remediation without exposing unnecessary sensitive details.
