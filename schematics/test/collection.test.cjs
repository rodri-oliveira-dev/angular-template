const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const { SchematicTestRunner } = require('@angular-devkit/schematics/testing');

const collectionPath = path.join(__dirname, '..', 'dist', 'collection.json');

test('loads the collection and discovers ng-new', async () => {
  const runner = new SchematicTestRunner('@rodri/angular-template', collectionPath);
  const tree = await runner.runSchematic('ng-new', { name: 'demo' });

  assert.deepEqual(tree.files, []);
});
