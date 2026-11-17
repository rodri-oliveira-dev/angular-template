import assert from 'node:assert/strict';
import test from 'node:test';
import { assessAudit } from './audit-dependencies.mjs';

const advisory = {
  name: 'picomatch',
  url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',
  severity: 'high',
};
const lockfile = {
  packages: {
    'node_modules/picomatch': { version: '4.0.7', dev: true },
    'node_modules/@angular/build': { version: '22.2.7', dev: true },
  },
};
function report() {
  return {
    metadata: { vulnerabilities: { high: 2 } },
    vulnerabilities: {
      picomatch: {
        severity: 'high',
        via: [advisory],
        nodes: ['node_modules/picomatch'],
        fixAvailable: false,
      },
      '@angular/build': {
        severity: 'high',
        via: ['picomatch'],
        nodes: ['node_modules/@angular/build'],
        fixAvailable: false,
      },
    },
  };
}
const beforeExpiry = new Date('2026-11-17T12:00:00Z');

test('allows only the known dev-only picomatch advisory while no fix exists', () => {
  assert.deepEqual(assessAudit(report(), lockfile, beforeExpiry), { waived: 2, findings: 2 });
});

test('passes when the audit has no blocking vulnerabilities', () => {
  assert.deepEqual(assessAudit({ metadata: {}, vulnerabilities: {} }, lockfile, beforeExpiry), {
    waived: 0,
    findings: 0,
  });
});

test('blocks a separate high-severity advisory', () => {
  const input = report();
  input.vulnerabilities['@angular/build'].via.push({
    name: '@angular/build',
    url: 'https://github.com/advisories/GHSA-other-advisory',
  });
  assert.throws(() => assessAudit(input, lockfile, beforeExpiry), /Unapproved/);
});

test('blocks a critical transitive vulnerability unrelated to picomatch', () => {
  const input = report();
  input.vulnerabilities.unrelated = {
    severity: 'critical',
    via: [{ name: 'unrelated', url: 'https://github.com/advisories/GHSA-other' }],
    nodes: ['node_modules/unrelated'],
  };
  assert.throws(() => assessAudit(input, lockfile, beforeExpiry), /Unapproved/);
});

test('blocks runtime dependencies', () => {
  const changedLock = structuredClone(lockfile);
  changedLock.packages['node_modules/picomatch'].dev = false;
  assert.throws(() => assessAudit(report(), changedLock, beforeExpiry), /dev-only/);
});

test('blocks newly available fixes and changes to the advisory', () => {
  const fixed = report();
  fixed.vulnerabilities.picomatch.fixAvailable = true;
  assert.throws(() => assessAudit(fixed, lockfile, beforeExpiry), /remediation/);
  const renamed = report();
  renamed.vulnerabilities.picomatch.via[0] = {
    ...advisory,
    url: 'https://github.com/advisories/GHSA-another',
  };
  assert.throws(() => assessAudit(renamed, lockfile, beforeExpiry), /remediation/);
});

test('expires the exception on December 17, 2026', () => {
  assert.throws(() => assessAudit(report(), lockfile, new Date('2026-12-17T00:00:00Z')), /expired/);
});

test('fails closed when audit output is missing or malformed', () => {
  assert.throws(() => assessAudit({}, lockfile, beforeExpiry), /valid vulnerability report/);
  const missingNodes = report();
  missingNodes.vulnerabilities.picomatch.nodes = [];
  assert.throws(() => assessAudit(missingNodes, lockfile, beforeExpiry), /omitted package nodes/);
});

test('allows cycles only when they also trace back to the approved picomatch advisory', () => {
  const input = report();
  input.vulnerabilities.vitest = {
    severity: 'high',
    via: ['picomatch', '@vitest/coverage-v8'],
    nodes: ['node_modules/vitest'],
  };
  input.vulnerabilities['@vitest/coverage-v8'] = {
    severity: 'high',
    via: ['vitest'],
    nodes: ['node_modules/@vitest/coverage-v8'],
  };
  const extendedLock = structuredClone(lockfile);
  extendedLock.packages['node_modules/vitest'] = { version: '5.0.0', dev: true };
  extendedLock.packages['node_modules/@vitest/coverage-v8'] = {
    version: '5.1.0',
    dev: true,
  };
  assert.deepEqual(assessAudit(input, extendedLock, beforeExpiry), { waived: 4, findings: 4 });
});

test('rejects cycles disconnected from the approved advisory', () => {
  const input = report();
  input.vulnerabilities.unrelated = {
    severity: 'high',
    via: ['other'],
    nodes: ['node_modules/unrelated'],
  };
  input.vulnerabilities.other = {
    severity: 'high',
    via: ['unrelated'],
    nodes: ['node_modules/other'],
  };
  assert.throws(() => assessAudit(input, lockfile, beforeExpiry), /Unapproved/);
});
