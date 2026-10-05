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

## Stable generation options

| Option              | Default                 | Semantics                                                     |
| ------------------- | ----------------------- | ------------------------------------------------------------- |
| `name`              | required                | Workspace, Angular project, and npm package name              |
| `directory`         | generated project name  | Output directory                                              |
| `style`             | `scss`                  | `scss` or plain `css` global/component styles                 |
| `routing`           | `true`                  | Router shell and lazy reference route                         |
| `apiMode`           | `mock`                  | Default development API path: `mock` or `bff`                 |
| `bffProxyTarget`    | `http://localhost:5000` | HTTP(S) target used by the BFF dev-server proxy               |
| `observability`     | `true`                  | Enable the local telemetry and performance providers          |
| `e2e`               | `true`                  | Include Playwright configuration, tests, scripts, and CI gate |
| `coverageThreshold` | `85`                    | Per-metric unit coverage threshold from 0 through 100         |
| `skipGit`           | `false`                 | Skip Angular CLI Git initialization                           |
| `skipInstall`       | `false`                 | Skip Angular CLI dependency installation                      |

The BFF target must be an absolute `http:` or `https:` URL without embedded credentials. Invalid
values fail before any generated tree is committed.
