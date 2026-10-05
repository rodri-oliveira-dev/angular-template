# Example data access

This directory is the feature-owned boundary for API clients, transport DTOs, request/response mapping, and server-state concerns.

The reference implementation demonstrates:

- typed access to the global same-origin API base path;
- GET and POST operations through `HttpClient`;
- explicit DTO-to-feature-model mapping;
- a local mock interceptor for `/api/examples`;
- BFF mode that passes the same browser-facing route through to the server;
- standardized errors handled by core HTTP infrastructure.

Components and pages do not inject `HttpClient` directly.

The data-access layer may know `/api/examples` because it is part of the browser-facing BFF contract. It must not know which internal API, hostname, service, or cloud endpoint the BFF uses downstream.

Runtime mode is selected in the composition/configuration layer, not inside the feature.
