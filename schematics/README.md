# `@rodri/angular-template` Schematics

This directory owns the standalone npm distribution for the Angular template. It compiles to
`schematics/dist` and contains only generation-time code and assets. The application in the
repository root remains the private, executable reference template; it is not a runtime library
and is not imported by consumers.

## Local development

```bash
npm run schematics:install
npm run schematics:build
npm run schematics:test
```

`src/collection.json` exposes the `ng-new` entry point. Package metadata points Angular CLI to the
compiled `dist/collection.json`; the build copies JSON assets next to the compiled JavaScript.
