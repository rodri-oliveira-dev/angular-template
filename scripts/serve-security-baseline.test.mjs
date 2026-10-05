import assert from 'node:assert/strict';
import test from 'node:test';

import {
  cacheControlFor,
  contentTypeFor,
  loadSecurityHeaders,
} from './serve-security-baseline.mjs';

test('loads the documented production security headers', () => {
  const headers = loadSecurityHeaders();

  assert.match(headers['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.match(headers['Permissions-Policy'], /camera=\(\)/);
});

test('uses explicit content types for executable browser assets', () => {
  assert.equal(contentTypeFor('index.html'), 'text/html; charset=utf-8');
  assert.equal(
    contentTypeFor('main-ABC12345.js'),
    'text/javascript; charset=utf-8',
  );
  assert.equal(
    contentTypeFor('styles-ABC12345.css'),
    'text/css; charset=utf-8',
  );
});

test('keeps the entry document non-storable while allowing fingerprinted assets', () => {
  assert.equal(cacheControlFor('index.html'), 'no-store');
  assert.equal(
    cacheControlFor('main-ABC12345.js'),
    'public, max-age=31536000, immutable',
  );
  assert.equal(cacheControlFor('favicon.ico'), 'no-cache');
});
