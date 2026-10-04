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

test('ignores browser API names inside comments and string literals', () => {
  const source = `
    // Never put tokens in localStorage or sessionStorage.
    const guidance = 'Do not persist credentials in localStorage';
  `;

  assert.deepEqual(findFrontendSecurityViolations(source, 'src/app/example.ts'), []);
});

test('rejects Angular sanitizer bypass calls', () => {
  const source = `
    sanitizer.bypassSecurityTrustHtml(untrustedHtml);
    sanitizer['bypassSecurityTrustUrl'](untrustedUrl);
  `;

  const violations = findFrontendSecurityViolations(source, 'src/app/example.ts');

  assert.equal(violations.filter((item) => item.policy === 'sanitizer bypass').length, 2);
});

test('rejects direct Web Storage access including computed properties', () => {
  const source = `
    window.localStorage.setItem('access_token', token);
    window['sessionStorage'].setItem('refresh_token', refreshToken);
    const storage = localStorage;
  `;

  const violations = findFrontendSecurityViolations(source, 'src/app/auth.ts');

  assert.equal(violations.filter((item) => item.policy === 'Web Storage').length, 3);
});

test('rejects dot and computed script-readable cookie access', () => {
  const source = `
    const first = document.cookie;
    const second = document['cookie'];
  `;

  const violations = findFrontendSecurityViolations(source, 'src/app/auth.ts');

  assert.equal(violations.filter((item) => item.policy === 'script-readable cookies').length, 2);
});
