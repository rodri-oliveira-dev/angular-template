import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const featuresRoot = path.resolve('src/app/features');

if (!fs.existsSync(featuresRoot)) {
  process.exit(0);
}

const violations = [];

for (const file of walk(featuresRoot)) {
  if (!file.endsWith('.ts')) {
    continue;
  }

  const sourceFeature = featureName(file);

  if (!sourceFeature) {
    continue;
  }

  const sourceText = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  for (const specifier of collectRelativeImports(sourceFile)) {
    const target = path.resolve(path.dirname(file), specifier);
    const targetFeature = featureName(target);

    if (targetFeature && targetFeature !== sourceFeature) {
      violations.push(
        `${path.relative(process.cwd(), file)} -> ${specifier} crosses from feature "${sourceFeature}" to "${targetFeature}"`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error(
    'Cross-feature imports are not allowed. Promote shared code to core/shared or document an explicit architectural exception.',
  );
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Feature boundary check passed.');

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

function featureName(filePath) {
  const relative = path.relative(featuresRoot, filePath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }

  return relative.split(path.sep)[0] || null;
}

function collectRelativeImports(sourceFile) {
  const imports = [];

  const visit = (node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text.startsWith('.')
    ) {
      imports.push(node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0]) &&
      node.arguments[0].text.startsWith('.')
    ) {
      imports.push(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return imports;
}
