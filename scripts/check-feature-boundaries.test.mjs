import assert from 'node:assert/strict';
import test from 'node:test';

import { collectRelativeModuleSpecifiers } from './check-feature-boundaries.mjs';

test('collects imports, dynamic imports, and re-export module specifiers', () => {
  const source = `
    import { localValue } from './local';
    export { Service } from '../other-feature/service';
    export * from '../another-feature';
    const lazy = import('../lazy-feature/page');
  `;

  assert.deepEqual(collectRelativeModuleSpecifiers(source), [
    './local',
    '../other-feature/service',
    '../another-feature',
    '../lazy-feature/page',
  ]);
});

test('ignores non-relative package module specifiers', () => {
  const source = `
    import { inject } from '@angular/core';
    export { Observable } from 'rxjs';
  `;

  assert.deepEqual(collectRelativeModuleSpecifiers(source), []);
});
