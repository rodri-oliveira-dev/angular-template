import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const appRoot = path.resolve('src/app');
const storageNames = new Set(['localStorage', 'sessionStorage']);
const sanitizerBypassNames = new Set([
  'bypassSecurityTrustHtml',
  'bypassSecurityTrustStyle',
  'bypassSecurityTrustScript',
  'bypassSecurityTrustUrl',
  'bypassSecurityTrustResourceUrl',
]);

const messages = {
  sanitizer:
    'Angular sanitizer bypass APIs require an explicit, narrowly scoped security exception.',
  storage:
    'Direct Web Storage access is blocked. Never persist access tokens, refresh tokens, session IDs, or credentials there.',
  cookie:
    'Direct document.cookie access is blocked. Prefer server-managed HttpOnly cookies for sessions.',
};

export function findFrontendSecurityViolations(source, filePath = '<memory>') {
  if (!filePath.endsWith('.ts')) {
    return [];
  }

  const normalizedPath = filePath.split(path.sep).join('/');
  const sourceFile = ts.createSourceFile(
    normalizedPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const violations = [];

  const addViolation = (policy, node, message) => {
    violations.push({
      policy,
      filePath: normalizedPath,
      index: node.getStart(sourceFile),
      message,
    });
  };

  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const calledName = memberName(node.expression);

      if (calledName && sanitizerBypassNames.has(calledName)) {
        addViolation('sanitizer bypass', node.expression, messages.sanitizer);
      }
    }

    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const objectName = expressionName(node.expression);
      const propertyName = memberName(node);

      if (objectName === 'document' && propertyName === 'cookie') {
        addViolation('script-readable cookies', node, messages.cookie);
      }

      if (
        storageNames.has(objectName ?? '') ||
        ((objectName === 'window' || objectName === 'globalThis') &&
          storageNames.has(propertyName ?? ''))
      ) {
        addViolation('Web Storage', node, messages.storage);
      }
    } else if (ts.isIdentifier(node) && storageNames.has(node.text) && isStandaloneReference(node)) {
      addViolation('Web Storage', node, messages.storage);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return deduplicateViolations(violations);
}

export function scanFrontendSecurity(root = appRoot) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const violations = [];

  for (const file of walk(root)) {
    if (!file.endsWith('.ts')) {
      continue;
    }

    const source = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(process.cwd(), file);
    violations.push(...findFrontendSecurityViolations(source, relativePath));
  }

  return violations;
}

function memberName(node) {
  if (ts.isPropertyAccessExpression(node)) {
    return node.name.text;
  }

  if (ts.isElementAccessExpression(node)) {
    const argument = node.argumentExpression;

    if (ts.isStringLiteralLike(argument)) {
      return argument.text;
    }
  }

  return null;
}

function expressionName(node) {
  if (ts.isIdentifier(node)) {
    return node.text;
  }

  return memberName(node);
}

function isStandaloneReference(node) {
  const parent = node.parent;

  if (!parent) {
    return true;
  }

  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    return false;
  }

  if (ts.isVariableDeclaration(parent) && parent.name === node) {
    return false;
  }

  if (ts.isParameter(parent) && parent.name === node) {
    return false;
  }

  if (ts.isPropertyDeclaration(parent) && parent.name === node) {
    return false;
  }

  if (ts.isPropertySignature(parent) && parent.name === node) {
    return false;
  }

  if (ts.isBindingElement(parent) && parent.name === node) {
    return false;
  }

  if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)) {
    return false;
  }

  return true;
}

function deduplicateViolations(violations) {
  const seen = new Set();

  return violations.filter((violation) => {
    const key = `${violation.policy}:${violation.index}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
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
