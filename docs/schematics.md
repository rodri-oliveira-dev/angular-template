> 🌐 Language: **English** | [Português (Brasil)](pt-BR/schematics.md)

# Angular Schematics distribution

`@rodri-oliveira-dev/angular-template` is a generation-time Angular Schematics collection. It composes the
official Angular CLI `ng-new` schematic and then applies this repository's architecture, API,
security, testing, observability, CI, workspace, and BFF baseline. It is not an Angular runtime
library and is not added to the generated application's dependencies.

## Supported toolchain

- package/template: `1.1.0`;
- Angular and Angular CLI: `22.2.x` (the collection builds against `22.2.1`);
- Node.js: `24.15.0+` within Node 24;
- TypeScript in generated projects: `~6.0.2`;
- npm with the generated, committed lockfile.

Only this Angular major is supported by v1.1. Do not use `--force` or `--legacy-peer-deps`.

## Install and create

For the concise global-tooling experience:

```bash
npm install --global @angular/cli@22.2.1 @rodri-oliveira-dev/angular-template@1.1.0
ng new my-app --collection=@rodri-oliveira-dev/angular-template
cd my-app
npm start
```

For project-local tooling without global installs:

```bash
mkdir angular-starter && cd angular-starter
npm init -y
npm install --save-dev @angular/cli@22.2.1 @rodri-oliveira-dev/angular-template@1.1.0
npx ng new my-app --collection=@rodri-oliveira-dev/angular-template
cd my-app
npm start
```

The generated project needs no manual edits. By default it starts against an in-memory mock at
`http://localhost:4200`.

## Options

| CLI option             | Type              | Default                 | Effect                                                        |
| ---------------------- | ----------------- | ----------------------- | ------------------------------------------------------------- |
| `name`                 | string            | required                | Workspace, Angular project, npm package, and display identity |
| `--directory`          | relative path     | normalized project name | Output directory; it cannot escape the current directory      |
| `--style`              | `scss` or `css`   | `scss`                  | Global and component stylesheet format                        |
| `--routing`            | boolean           | `true`                  | Router shell and lazy reference route                         |
| `--api-mode`           | `mock` or `bff`   | `mock`                  | Default development API mode                                  |
| `--bff-proxy-target`   | absolute HTTP URL | `http://localhost:5000` | BFF development proxy target; credentials are rejected        |
| `--observability`      | boolean           | `true`                  | Local telemetry and performance providers                     |
| `--e2e`                | boolean           | `true`                  | Playwright configs, tests, scripts, and CI gate               |
| `--coverage-threshold` | integer `0..100`  | `85`                    | Per-metric statements/branches/functions/lines gate           |
| `--skip-git`           | boolean           | `false`                 | Skip Angular CLI Git initialization                           |
| `--skip-install`       | boolean           | `false`                 | Skip Angular CLI dependency installation                      |

Defaults reproduce the recommended v1.0 runtime baseline. Examples:

```bash
# Default local-mock project
ng new customer-portal --collection=@rodri-oliveira-dev/angular-template

# BFF-first development with a custom proxy and stricter coverage
ng new customer-portal --collection=@rodri-oliveira-dev/angular-template \
  --api-mode=bff \
  --bff-proxy-target=https://localhost:7443 \
  --coverage-threshold=90

# Plain CSS, no router, telemetry runtime disabled, and no E2E baseline
ng new small-app --collection=@rodri-oliveira-dev/angular-template \
  --style=css \
  --routing=false \
  --observability=false \
  --e2e=false
```

The schematic rejects unsafe proxy URLs, unsupported enum values, parent/absolute output paths,
and generation over an existing Angular workspace before committing the tree.

## Validate a generated project

The default output exposes the same gates as this repository:

```bash
npm ci
npm run format:check
npm run lint
npm run security:all
npm run test:coverage
npm run coverage:check
npm run build
npm run bootstrap:verify
npm run e2e:mock
npm run e2e:bff
```

`npm run e2e` runs both browser modes. A project generated with `--e2e=false` intentionally omits
Playwright dependencies, files, scripts, and CI steps.

## Collection development

The root application remains private and executable. Generation-time ownership is isolated under
`schematics/`; its build copies the source-of-truth application baseline into the distributable
artifact without runtime paths back to the checkout.

```bash
npm run schematics:install
npm run schematics:build
npm run schematics:test
npm run schematics:package:validate
npm run schematics:integration
```

The unit suite uses a virtual tree for schema, orchestration, option, failure, identity, and
re-entry assertions. The integration harness creates a temporary consumer outside this checkout,
installs the packed `.tgz`, invokes Angular CLI, runs every generated-project gate, and always
removes its temporary directory.

`schematics:package:validate` runs `npm pack`, prints and verifies the real tarball manifest, rejects
internal/compiler-only files, installs the archive into a clean consumer, and loads its `ng-new`
collection. The package contains only `package.json`, its README, compiled JavaScript,
`collection.json`, `schema.json`, and required generation templates.

## Release and publish

Template and package versions move together. Tag `v1.1.0` can publish only package version `1.1.0`.
`.github/workflows/publish-schematics.yml` runs only for version tags in the canonical repository,
revalidates the tarball and generated consumer, and publishes from a GitHub-hosted runner through
npm trusted publishing (OIDC). No npm token or other secret is committed; npm adds provenance.

Before the first real release, the publisher must:

1. own or create the `@rodri-oliveira-dev` npm scope and claim the first `@rodri-oliveira-dev/angular-template` package;
2. configure its npm trusted publisher for GitHub user `rodri-oliveira-dev`, repository
   `angular-template`, workflow `publish-schematics.yml`, and direct publish permission;
3. configure the GitHub `npm` environment with required maintainer approval;
4. push an annotated tag that exactly matches `schematics/package.json` only after `main` is green.

No implementation or smoke test publishes a real npm version. Until the first registry release,
use `npm run schematics:package:validate` and `npm run schematics:integration` with the local `.tgz`.

The GitHub Template route remains documented as a fallback in
[Template Repository Setup](template-repository.md).
