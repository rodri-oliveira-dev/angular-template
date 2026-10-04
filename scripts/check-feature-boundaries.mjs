import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const featuresRoot = path.resolve('src/app/features');

export function collectRelativeModuleSpecifiers(source, fileName = '<memory>') {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const specifiers = [];

  const visit = (node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text.startsWith('.')
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text.startsWith('.')
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0]) &&
      node.arguments[0].text.startsWith('.')
    ) {
      specifiers.push(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return specifiers;
}

export function findFeatureBoundaryViolations(root = featuresRoot) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const violations = [];

  for (const file of walk(root)) {
    if (!file.endsWith('.ts')) {
      continue;
    }

    const sourceFeature = featureName(file, root);

    if (!sourceFeature) {
      continue;
    }

    const sourceText = fs.readFileSync(file, 'utf8');

    for (const specifier of collectRelativeModuleSpecifiers(sourceText, file)) {
      const target = path.resolve(path.dirname(file), specifier);
      const targetFeature = featureName(target, root);

      if (targetFeature && targetFeature !== sourceFeature) {
        violations.push(
          `${path.relative(process.cwd(), file)} -> ${specifier} crosses from feature "${sourceFeature}" to "${targetFeature}"`,
        );
      }
    }
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

function featureName(filePath, root = featuresRoot) {
  const relative = path.relative(root, filePath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }

  return relative.split(path.sep)[0] || null;
}

function main() {
  const violations = findFeatureBoundaryViolations();

  if (violations.length > 0) {
    console.error(
      'Cross-feature imports are not allowed. Promote shared code to core/shared or document an explicit architectural exception.',
    );

    for (const violation of violations) {
      console.error(`- ${violation}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log('Feature boundary check passed.');
}

const currentFile = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  main();
}
