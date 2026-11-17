import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const exception = Object.freeze({
  advisory: 'GHSA-fc5q-39xc-vjpf',
  dependency: 'picomatch',
  version: '4.0.7',
  expires: '2026-12-17',
});
const blockingSeverities = new Set(['high', 'critical']);

export function assessAudit(report, lockfile, now = new Date()) {
  if (!report?.metadata || !report?.vulnerabilities || typeof report.vulnerabilities !== 'object') {
    throw new Error('npm audit did not return a valid vulnerability report.');
  }

  const blocking = Object.entries(report.vulnerabilities).filter(([, item]) =>
    blockingSeverities.has(item.severity),
  );
  if (blocking.length === 0) {
    return { waived: 0, findings: 0 };
  }

  // Time-boxed risk acceptance: there is no fixed picomatch release yet.
  // Only development-only occurrences caused exclusively by this exact advisory qualify.
  const ends = new Date(`${exception.expires}T00:00:00Z`);
  if (now >= ends) {
    throw new Error(`Temporary ${exception.advisory} exception expired on ${exception.expires}.`);
  }
  const packageEntry = lockfile?.packages?.[`node_modules/${exception.dependency}`];
  if (packageEntry?.version !== exception.version || packageEntry.dev !== true) {
    throw new Error('picomatch is not the reviewed dev-only 4.0.7 lockfile entry.');
  }
  const source = report.vulnerabilities[exception.dependency];
  const advisories = source?.via?.filter((via) => typeof via === 'object' && via !== null);
  if (
    source?.fixAvailable !== false ||
    advisories?.length !== 1 ||
    advisories[0].name !== exception.dependency ||
    advisories[0].url !== `https://github.com/advisories/${exception.advisory}`
  ) {
    throw new Error('picomatch advisory changed or a remediation is available.');
  }

  function originatesOnlyFromException(name, visiting = new Set()) {
    if (visiting.has(name)) return false;
    const item = report.vulnerabilities[name];
    if (!item || !Array.isArray(item.via) || item.via.length === 0) return false;
    if (name === exception.dependency) return true;
    const next = new Set(visiting);
    next.add(name);
    return item.via.every(
      (parent) => typeof parent === 'string' && originatesOnlyFromException(parent, next),
    );
  }

  for (const [name, item] of blocking) {
    if (!originatesOnlyFromException(name)) {
      throw new Error(`Unapproved high/critical vulnerability found in ${name}.`);
    }
    if (!Array.isArray(item.nodes) || item.nodes.length === 0) {
      throw new Error(`npm audit omitted package nodes for ${name}.`);
    }
    for (const node of item.nodes) {
      if (lockfile.packages[node]?.dev !== true) {
        throw new Error(`Vulnerable package ${name} is not development-only (${node}).`);
      }
    }
  }
  return { waived: blocking.length, findings: blocking.length };
}

function main() {
  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['audit', '--json', '--audit-level=high'],
    {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    },
  );
  if (result.error) throw result.error;
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw new Error(`npm audit returned invalid JSON (exit code ${result.status}): ${result.stderr}`);
  }
  const lockfile = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  const verdict = assessAudit(report, lockfile);
  if (![0, 1].includes(result.status) || (result.status === 1 && verdict.findings === 0)) {
    throw new Error(`npm audit failed unexpectedly (exit code ${result.status}).`);
  }
  if (verdict.waived > 0) {
    console.warn(
      `TEMPORARY SECURITY EXCEPTION: ${verdict.waived} dev-only audit findings trace solely to ${exception.advisory}. ` +
        `No patched version is available. Expires ${exception.expires}.`,
    );
  } else {
    console.log('npm audit: no high or critical vulnerabilities.');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
