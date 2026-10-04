import assert from 'node:assert/strict';
import test from 'node:test';

import { findFrontendSecurityViolations } from './check-frontend-security.mjs';

test('accepts ordinary Angular-safe bindings and application code', () => {
  const source = `
    export class Example {
      readonly label = '<strong>Angular sanitizes bound HTML by context</strong>';
    }
  `;

  assert.deepEqual(findFrontendSecurityViolations(source, 'src/app/example.ts'), []);
});

test('rejects Angular sanitizer bypass calls', () => {
  const source = `
    sanitizer.bypassSecurityTrustHtml(untrustedHtml);
  `;

  const violations = findFrontendSecurityViolations(source, 'src/app/example.ts');

  assert.equal(violations.length, 1);
  assert.equal(violations[0].policy, 'sanitizer bypass');
});

test('rejects direct Web Storage access', () => {
  const source = `
    window.localStorage.setItem('access_token', token);
    sessionStorage.setItem('refresh_token', refreshToken);
  `;

  const violations = findFrontendSecurityViolations(source, 'src/app/auth.ts');

  assert.equal(violations.filter((item) => item.policy === 'Web Storage').length, 2);
});

test('rejects script-readable cookie access', () => {
  const violations = findFrontendSecurityViolations(
    `const cookies = document.cookie;`,
    'src/app/auth.ts',
  );

  assert.equal(violations.length, 1);
  assert.equal(violations[0].policy, 'script-readable cookies');
});
