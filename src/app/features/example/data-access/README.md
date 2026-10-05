# Example data access

This directory is the feature-owned boundary for API clients, transport DTOs, request/response mapping, and server-state concerns.

The reference implementation demonstrates:

- typed access to the global same-origin API base path;
- `GET /api/examples` and `POST /api/examples` through `HttpClient`;
- explicit DTO-to-feature-model mapping;
- a local mock interceptor for the same browser-facing contract;
- BFF mode that passes requests through to the server boundary;
- XSRF on state-changing BFF requests;
- Problem Details mapped to `ApiError`;
- correlation and HTTP telemetry handled by core infrastructure.

Components and pages do not inject `HttpClient` directly.

The data-access layer may know `/api/examples` because it is part of the browser-facing BFF contract. It must not know which internal API, hostname, service, or cloud endpoint the BFF uses downstream.

Runtime mode is selected in the composition/configuration layer, not inside the feature.


## Reference contract

The browser-facing transport contract is:

- list: `GET /api/examples` -> `ExampleItemDto[]`;
- create: `POST /api/examples` with `{ "name": string }` -> `ExampleItemDto`;
- errors: Problem Details;
- correlation: `X-Correlation-ID`;
- state-changing requests: `X-XSRF-TOKEN` when the BFF has issued `XSRF-TOKEN`.

The local mock and BFF mode intentionally share this contract. Switching modes must not require changes to components or pages.
