import assert from 'node:assert/strict';
import test from 'node:test';

import { buildComment, collectGateResults } from './report-ci-pr-status.mjs';

test('reports success only when every required gate succeeds', () => {
  const gates = collectGateResults(
    Object.fromEntries([
      ['CHECKOUT_OUTCOME', 'success'],
      ['SETUP_NODE_OUTCOME', 'success'],
      ['RUNTIME_VERSIONS_OUTCOME', 'success'],
      ['INSTALL_DEPENDENCIES_OUTCOME', 'success'],
      ['REPORTER_TESTS_OUTCOME', 'success'],
      ['FORMAT_CHECK_OUTCOME', 'success'],
      ['LINT_GUARDRAILS_OUTCOME', 'success'],
      ['SECURITY_GATE_OUTCOME', 'success'],
      ['UNIT_TESTS_OUTCOME', 'success'],
      ['COVERAGE_GATE_OUTCOME', 'success'],
      ['PRODUCTION_BUILD_OUTCOME', 'success'],
      ['CLEAN_BOOTSTRAP_OUTCOME', 'success'],
      ['DAST_SERVER_OUTCOME', 'success'],
      ['ZAP_BASELINE_OUTCOME', 'success'],
      ['PLAYWRIGHT_INSTALL_OUTCOME', 'success'],
      ['E2E_OUTCOME', 'success'],
    ]),
  );

  const comment = buildComment({
    gates,
    runUrl: 'https://example.test/run/1',
    sha: '1234567890abcdef',
  });

  assert.match(comment, /✅ \*\*Success\*\*/);
  assert.doesNotMatch(comment, /Failed gates/);
  assert.match(comment, /Commit: `1234567`/);
});

test('reports only actual failed gates as failures and skipped gates separately', () => {
  const gates = collectGateResults({
    CHECKOUT_OUTCOME: 'success',
    SETUP_NODE_OUTCOME: 'success',
    RUNTIME_VERSIONS_OUTCOME: 'success',
    INSTALL_DEPENDENCIES_OUTCOME: 'success',
    FORMAT_CHECK_OUTCOME: 'failure',
    LINT_GUARDRAILS_OUTCOME: 'skipped',
    SECURITY_GATE_OUTCOME: 'skipped',
    UNIT_TESTS_OUTCOME: 'skipped',
    COVERAGE_GATE_OUTCOME: 'skipped',
    PRODUCTION_BUILD_OUTCOME: 'skipped',
    CLEAN_BOOTSTRAP_OUTCOME: 'skipped',
    DAST_SERVER_OUTCOME: 'skipped',
    ZAP_BASELINE_OUTCOME: 'skipped',
    PLAYWRIGHT_INSTALL_OUTCOME: 'skipped',
    E2E_OUTCOME: 'skipped',
  });

  const comment = buildComment({
    gates,
    runUrl: 'https://example.test/run/2',
  });

  assert.match(comment, /❌ \*\*Failure\*\*/);
  assert.match(comment, /- ❌ Format check/);
  assert.doesNotMatch(comment, /- ❌ OWASP ZAP baseline/);
  assert.match(comment, /- ⏭️ OWASP ZAP baseline/);
});

test('treats cancelled gates as a failure', () => {
  const comment = buildComment({
    gates: [
      { name: 'Security gate', outcome: 'cancelled' },
      { name: 'E2E', outcome: 'skipped' },
    ],
    runUrl: 'https://example.test/run/3',
  });

  assert.match(comment, /- ❌ Security gate/);
  assert.match(comment, /- ⏭️ E2E/);
});
