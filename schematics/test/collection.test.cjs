const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const { SchematicTestRunner } = require('@angular-devkit/schematics/testing');

const collectionPath = path.join(__dirname, '..', 'dist', 'collection.json');

test('composes Angular ng-new and applies the baseline in a virtual tree', async () => {
  const runner = new SchematicTestRunner('@rodri/angular-template', collectionPath);
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

  const angularJson = JSON.parse(tree.readContent('/sample-app/angular.json'));
  assert.ok(angularJson.projects['sample-app']);
  assert.equal(
    angularJson.projects['sample-app'].architect.serve.configurations.development.buildTarget,
    'sample-app:build:development',
  );

  assert.equal(runner.tasks.length, 0);
});
