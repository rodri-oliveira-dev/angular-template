const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const { SchematicTestRunner } = require('@angular-devkit/schematics/testing');

const collectionPath = path.join(__dirname, '..', 'dist', 'collection.json');

test('defaults reproduce the recommended mock, routing, observability, and E2E baseline', async () => {
  const runner = new SchematicTestRunner('@rodri-oliveira-dev/angular-template', collectionPath);
  const tree = await runner.runSchematic('ng-new', {
    name: 'Sample App',
    skipGit: true,
    skipInstall: true,
  });

  assert.ok(tree.files.includes('/sample-app/src/app/core/config/api.config.ts'));
  assert.ok(tree.files.includes('/sample-app/e2e/app.spec.ts'));

  const packageJson = JSON.parse(tree.readContent('/sample-app/package.json'));
  assert.equal(packageJson.name, 'sample-app');
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.scripts['schematics:build'], undefined);
  assert.equal(packageJson.scripts['build:pages'], undefined);

  const angularJson = JSON.parse(tree.readContent('/sample-app/angular.json'));
  assert.ok(angularJson.projects['sample-app']);
  assert.equal(
    angularJson.projects['sample-app'].architect.build.options.inlineStyleLanguage,
    'scss',
  );
  assert.equal(
    angularJson.projects['sample-app'].architect.test.options.coverageThresholds.branches,
    85,
  );
  assert.equal(
    angularJson.projects['sample-app'].architect.serve.configurations.development.buildTarget,
    'sample-app:build:development',
  );
  assert.ok(
    angularJson.projects['sample-app'].architect.build.configurations.development.fileReplacements,
  );
  assert.equal(angularJson.projects['sample-app'].architect.build.configurations.pages, undefined);
  assert.match(tree.readContent('/sample-app/src/app/app.config.ts'), /enabled: true/);
  assert.ok(tree.files.includes('/sample-app/playwright.config.ts'));
  assert.match(tree.readContent('/sample-app/playwright.config.ts'), /npm run start:mock/);
  assert.ok(tree.files.includes('/sample-app/sample-app.code-workspace'));
  assert.match(tree.readContent('/sample-app/src/index.html'), /<title>Sample App<\/title>/);
  assert.ok(tree.files.includes('/sample-app/.gitignore'));
  assert.ok(!tree.files.includes('/sample-app/gitignore.template'));
  assert.ok(!tree.files.includes('/sample-app/.github/workflows/initialize-template.yml'));
  assert.ok(!tree.files.includes('/sample-app/.github/workflows/pages.yml'));
  assert.ok(!tree.files.includes('/sample-app/scripts/prepare-pages.mjs'));
  assert.doesNotMatch(tree.readContent('/sample-app/README.md'), /^### GitHub Pages live demo$/m);
  assert.doesNotMatch(
    tree.readContent('/sample-app/README.pt-BR.md'),
    /^### Demo online no GitHub Pages$/m,
  );
  assert.match(tree.readContent('/sample-app/.gitignore'), /^\/playwright-report-bff\/$/m);
  assert.match(tree.readContent('/sample-app/.gitignore'), /^\/report_html\.html$/m);
  assert.doesNotMatch(tree.readContent('/sample-app/.gitignore'), /^\/schematics\//m);

  const identitySensitiveFiles = tree.files.filter((file) =>
    [
      '/.github/workflows/',
      '/angular.json',
      '/package.json',
      '/scripts/',
      '/src/',
      '.code-workspace',
    ].some((segment) => file.includes(segment)),
  );
  for (const file of identitySensitiveFiles) {
    assert.doesNotMatch(tree.readContent(file), /angular-template/i, file);
  }

  assert.equal(runner.tasks.length, 0);
});

test('keeps E2E valid when routing is disabled', async () => {
  const runner = new SchematicTestRunner('@rodri-oliveira-dev/angular-template', collectionPath);
  const tree = await runner.runSchematic('ng-new', {
    name: 'no-router',
    routing: false,
    skipGit: true,
    skipInstall: true,
  });

  const e2e = tree.readContent('/no-router/e2e/app.spec.ts');
  assert.match(e2e, /bootstraps the application shell/);
  assert.doesNotMatch(e2e, /primary navigation/);
  assert.doesNotMatch(e2e, /toHaveURL/);
  assert.match(e2e, /Feature-first by default/);
});

test('maps the maintained non-default option combination deterministically', async () => {
  const runner = new SchematicTestRunner('@rodri-oliveira-dev/angular-template', collectionPath);
  const tree = await runner.runSchematic('ng-new', {
    apiMode: 'bff',
    bffProxyTarget: 'https://localhost:7443',
    coverageThreshold: 90,
    e2e: false,
    name: 'BFF Portal',
    observability: false,
    routing: false,
    skipGit: true,
    skipInstall: true,
    style: 'css',
  });

  assert.ok(tree.files.includes('/bff-portal/src/styles.css'));
  assert.ok(!tree.files.includes('/bff-portal/src/styles.scss'));
  assert.ok(!tree.files.includes('/bff-portal/src/app/app.routes.ts'));
  assert.ok(!tree.files.includes('/bff-portal/playwright.config.ts'));
  assert.ok(!tree.files.some((file) => file.startsWith('/bff-portal/e2e/')));

  const angularJson = JSON.parse(tree.readContent('/bff-portal/angular.json'));
  const project = angularJson.projects['bff-portal'];
  assert.equal(project.architect.serve.defaultConfiguration, 'bff');
  assert.equal(project.architect.build.options.inlineStyleLanguage, 'css');
  assert.deepEqual(project.architect.build.configurations.development.fileReplacements, [
    {
      replace: 'src/app/core/config/api.runtime-config.ts',
      with: 'src/app/core/config/api.runtime-config.mock.ts',
    },
  ]);
  assert.deepEqual(project.architect.test.options.coverageThresholds, {
    statements: 90,
    branches: 90,
    functions: 90,
    lines: 90,
  });

  const packageJson = JSON.parse(tree.readContent('/bff-portal/package.json'));
  assert.equal(packageJson.scripts.e2e, undefined);
  assert.doesNotMatch(packageJson.scripts['ci:verify'], /npm run e2e/);
  assert.equal(packageJson.devDependencies['@playwright/test'], undefined);
  assert.equal(
    JSON.parse(tree.readContent('/bff-portal/src/proxy.bff.conf.json'))['/api/**'].target,
    'https://localhost:7443',
  );
  assert.match(tree.readContent('/bff-portal/src/app/app.config.ts'), /enabled: false/);
  assert.match(tree.readContent('/bff-portal/scripts/check-coverage-gate.mjs'), /\?\? '90'/);
  assert.doesNotMatch(tree.readContent('/bff-portal/.github/workflows/ci.yml'), /Playwright/);
});

test('keeps the mock E2E server available for BFF-first projects', async () => {
  const runner = new SchematicTestRunner('@rodri-oliveira-dev/angular-template', collectionPath);
  const tree = await runner.runSchematic('ng-new', {
    apiMode: 'bff',
    name: 'bff-e2e',
    skipGit: true,
    skipInstall: true,
  });

  const angularJson = JSON.parse(tree.readContent('/bff-e2e/angular.json'));
  const project = angularJson.projects['bff-e2e'];
  assert.equal(project.architect.serve.defaultConfiguration, 'bff');
  assert.ok(project.architect.build.configurations.development.fileReplacements);
  assert.match(tree.readContent('/bff-e2e/playwright.config.ts'), /npm run start:mock/);
  assert.match(tree.readContent('/bff-e2e/package.json'), /"start:mock"/);
});

test('rejects unsafe BFF targets with an actionable error', async () => {
  const runner = new SchematicTestRunner('@rodri-oliveira-dev/angular-template', collectionPath);

  await assert.rejects(
    runner.runSchematic('ng-new', {
      bffProxyTarget: 'https://user:secret@example.test',
      name: 'invalid-target',
      skipGit: true,
      skipInstall: true,
    }),
    /must not contain credentials/,
  );
});

test('guards repeated generation without modifying the existing workspace', async () => {
  const runner = new SchematicTestRunner('@rodri-oliveira-dev/angular-template', collectionPath);
  const options = { name: 'repeat-safe', skipGit: true, skipInstall: true };
  const tree = await runner.runSchematic('ng-new', options);
  const originalPackage = tree.readContent('/repeat-safe/package.json');

  await assert.rejects(
    runner.runSchematic('ng-new', options, tree),
    /an Angular workspace already exists there/,
  );
  assert.equal(tree.readContent('/repeat-safe/package.json'), originalPackage);
});

test('rejects output paths that escape the working directory', async () => {
  const runner = new SchematicTestRunner('@rodri-oliveira-dev/angular-template', collectionPath);

  await assert.rejects(
    runner.runSchematic('ng-new', {
      directory: '../outside',
      name: 'unsafe-directory',
      skipGit: true,
      skipInstall: true,
    }),
    /directory must stay within the current working directory/,
  );
});

test('schema rejects unsupported style formats', async () => {
  const runner = new SchematicTestRunner('@rodri-oliveira-dev/angular-template', collectionPath);

  await assert.rejects(
    runner.runSchematic('ng-new', {
      name: 'invalid-style',
      skipGit: true,
      skipInstall: true,
      style: 'less',
    }),
    /Schematic input does not validate/,
  );
});
