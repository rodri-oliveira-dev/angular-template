> 🌐 Language: **English** | [Português (Brasil)](../pt-BR/architecture/README.md)

# Architecture

The template uses a lightweight **feature-first Angular architecture**.

## Application boundaries

### `features/`

The default home for product behavior. A feature should own its pages, feature-local components, models, and data-access code.

### `core/`

Application-wide infrastructure only. Prefer a feature-local dependency unless the responsibility is genuinely global.

### `shared/`

Reusable presentation and stateless utilities. It is not a dumping ground for code that lacks a clear owner.

## Dependency direction

The intended dependency direction is:

```text
app shell
   |
   +--> features
   |      |
   |      +--> shared
   |      +--> core infrastructure (when necessary)
   |
   +--> shared
   +--> core
```

A feature must not import another feature's internal implementation. If two features truly need the same building block, extract the smallest appropriate abstraction to `shared/` or `core/`.

## Routing

Top-level feature entry points should prefer lazy loading. The reference `example` feature is loaded through `loadComponent` in `app.routes.ts`.

## Naming and placement

- Pages are route-level components and live under `pages/`.
- Components that exist only for one feature live under that feature's `components/`.
- External transport and server-state concerns live under feature-local `data-access/`.
- Feature-specific types live under `models/`.
- Promote code to `shared/` or `core/` only after its cross-feature responsibility is clear.

## What this architecture intentionally avoids

- backend-style application/domain/infrastructure layers copied literally into Angular;
- a global generic repository abstraction;
- a mandatory global state library;
- cross-feature imports that bypass explicit boundaries.
