# Example data access

This directory is the feature-owned boundary for API clients, transport DTOs, request/response mapping, and server-state concerns.

The reference implementation demonstrates:

- typed access to the global API base path;
- GET and POST operations through `HttpClient`;
- explicit DTO-to-feature-model mapping;
- a local mock interceptor for `/api/examples`;
- standardized errors handled by core HTTP infrastructure.

Components and pages do not inject `HttpClient` directly.

Set `useLocalMock: false` in the API configuration when connecting the example to a real backend.
