# ADR 0001: Feature-first Angular architecture

- Status: Accepted
- Date: 2026-10-04

## Context

The template needs an architecture that scales beyond a demo application without importing backend layering into the browser. Angular applications benefit from keeping route-level capabilities cohesive while reserving global directories for genuinely cross-cutting responsibilities.

## Decision

Use a feature-first structure:

- `features/` owns business capabilities;
- `core/` owns application-wide infrastructure;
- `shared/` owns reusable presentation and stateless utilities;
- top-level features prefer lazy loading;
- one feature must not depend directly on another feature's internals.

A feature may organize itself into `pages/`, `components/`, `models/`, and `data-access/` when those responsibilities exist.

## Consequences

### Positive

- feature ownership stays visible;
- lazy loading has a natural boundary;
- most changes remain local to one capability;
- global folders are less likely to become dumping grounds.

### Trade-offs

- some small features will not need every suggested subdirectory;
- extracting shared code requires an explicit decision;
- architectural boundaries rely on conventions until automated dependency checks are introduced in a later quality phase.

## Alternatives considered

### Backend-style Clean Architecture layers

Rejected as a default because duplicating application/domain/infrastructure layers in Angular adds ceremony without necessarily improving browser-side cohesion.

### One global components/services/models structure

Rejected because ownership becomes unclear as the application grows and unrelated features become coupled through generic folders.
