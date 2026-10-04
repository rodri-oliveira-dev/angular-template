import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve('src/app');

const policies = [
  {
    name: 'sanitizer bypass',
    pattern: /\bbypassSecurityTrust(?:Html|Style|Script|Url|ResourceUrl)\s*\(/g,
    message:
      'Angular sanitizer bypass APIs require an explicit, narrowly scoped security exception.',
    allowlist: new Set(),
  },
  {
    name: 'Web Storage',
    pattern: /\b(?:window\.)?(?:localStorage|sessionStorage)\b/g,
    message:
      'Direct Web Storage access is blocked. Never persist access tokens, refresh tokens, session IDs, or credentials there.',
    allowlist: new Set(),
  },
  {
    name: 'script-readable cookies',
    pattern: /\bdocument\s*\.\s*cookie\b/g,
    message:
      'Direct document.cookie access is blocked. Prefer server-managed HttpOnly cookies for sessions.',
    allowlist: new Set(),
  },
];

export function findFrontendSecurityViolations(source, filePath = '<memory>') {
  const normalizedPath = filePath.split(path.sep).join('/');
  const violations = [];

  for (const policy of policies) {
    if (policy.allowlist.has(normalizedPath)) {
      continue;
    }

    for (const match of source.matchAll(policy.pattern)) {
      violations.push({
        policy: policy.name,
        filePath: normalizedPath,
        index: match.index ?? 0,
        message: policy.message,
      });
    }
  }

  return violations;
}

export function scanFrontendSecurity(root = appRoot) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const violations = [];

  for (const file of walk(root)) {
    if (!file.endsWith('.ts') && !file.endsWith('.html')) {
      continue;
    }

    const source = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(process.cwd(), file);
    violations.push(...findFrontendSecurityViolations(source, relativePath));
  }

  return violations;
}

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

function main() {
  const violations = scanFrontendSecurity();

  if (violations.length === 0) {
    console.log('Frontend security check passed.');
    return;
  }

  console.error('Frontend security baseline violations found:');

  for (const violation of violations) {
    console.error(`- ${violation.filePath}: ${violation.message}`);
  }

  process.exitCode = 1;
}

const currentFile = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  main();
}
