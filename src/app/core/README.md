> 🌐 Language: **English** | [Português (Brasil)](README.pt-BR.md)

# Core

`core/` contains application-wide infrastructure that should normally have a single shared instance or configuration point.

Current examples include:

- typed API configuration;
- correlation ID handling;
- standardized HTTP error mapping;
- Problem Details support.

Other suitable responsibilities include:

- global error handling;
- guards;
- cross-cutting interceptors;
- application-wide providers.

Business logic and feature-specific services do not belong here. API clients remain owned by the feature that consumes them.
