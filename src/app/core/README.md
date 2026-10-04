# Core

`core/` contains application-wide infrastructure that should normally have a single shared instance or configuration point.

Suitable examples:

- application configuration;
- global error handling;
- guards and interceptors;
- cross-cutting infrastructure services;
- application-wide providers.

Business logic and feature-specific services do not belong here.
