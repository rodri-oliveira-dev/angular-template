import fs from 'node:fs';
import path from 'node:path';

const configuredGate = Number(process.env.COVERAGE_GATE ?? '85');

if (!Number.isFinite(configuredGate) || configuredGate < 0 || configuredGate > 100) {
  console.error(`Invalid COVERAGE_GATE value: ${process.env.COVERAGE_GATE}`);
  process.exit(1);
}

const angularConfig = JSON.parse(fs.readFileSync('angular.json', 'utf8'));
const thresholds =
  angularConfig.projects?.['angular-template']?.architect?.test?.options?.coverageThresholds;

if (!thresholds) {
  console.error('Coverage thresholds were not found in angular.json.');
  process.exit(1);
}

const summaryPath = path.resolve('coverage/coverage-summary.json');

if (!fs.existsSync(summaryPath)) {
  console.error(
    'coverage/coverage-summary.json was not found. Run npm run test:coverage before the coverage gate.',
  );
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const metrics = ['statements', 'branches', 'functions', 'lines'];
const failures = [];

console.log(`Coverage gate: ${configuredGate}% minimum per metric`);

for (const metric of metrics) {
  const configuredThreshold = Number(thresholds[metric]);

  if (!Number.isFinite(configuredThreshold)) {
    failures.push(`${metric}: missing threshold in angular.json`);
    continue;
  }

  if (configuredThreshold < configuredGate) {
    failures.push(
      `${metric}: angular.json threshold is ${configuredThreshold}%, below required workflow gate ${configuredGate}%`,
    );
  }

  const percentage = Number(summary.total?.[metric]?.pct);

  if (!Number.isFinite(percentage)) {
    failures.push(`${metric}: coverage percentage is missing from coverage-summary.json`);
    continue;
  }

  const required = Math.max(configuredGate, configuredThreshold);
  const status = percentage >= required ? 'PASS' : 'FAIL';

  console.log(
    `- ${metric.padEnd(10)} ${percentage.toFixed(2)}% / required ${required.toFixed(2)}% [${status}]`,
  );

  if (percentage < required) {
    failures.push(`${metric}: ${percentage.toFixed(2)}% is below required ${required.toFixed(2)}%`);
  }
}

if (failures.length > 0) {
  console.error('\nCoverage gate failed:');

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log('\nCoverage gate passed.');
