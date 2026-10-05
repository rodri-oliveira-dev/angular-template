import { cp, mkdir } from 'node:fs/promises';

const sourceRoot = new URL('../src/', import.meta.url);
const outputRoot = new URL('../dist/', import.meta.url);

await mkdir(new URL('ng-new/', outputRoot), { recursive: true });
await cp(new URL('collection.json', sourceRoot), new URL('collection.json', outputRoot));
await cp(new URL('ng-new/schema.json', sourceRoot), new URL('ng-new/schema.json', outputRoot));

const repositoryRoot = new URL('../../', import.meta.url);
const templateRoot = new URL('ng-new/files/', outputRoot);
const templateEntries = [
  '.coderabbit.yaml',
  '.editorconfig',
  '.github',
  '.gitignore',
  '.nvmrc',
  '.prettierignore',
  '.prettierrc.json',
  '.zap',
  'angular.json',
  'angular-template.code-workspace',
  'CHANGELOG.md',
  'CHANGELOG.pt-BR.md',
  'codecov.yml',
  'CONTRIBUTING.md',
  'CONTRIBUTING.pt-BR.md',
  'docs',
  'e2e',
  'e2e-bff',
  'eslint.config.js',
  'LICENSE',
  'package-lock.json',
  'package.json',
  'playwright.bff.config.ts',
  'playwright.config.ts',
  'public',
  'README.md',
  'README.pt-BR.md',
  'scripts',
  'SECURITY.md',
  'SECURITY.pt-BR.md',
  'src',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.spec.json',
];

await mkdir(templateRoot, { recursive: true });
for (const entry of templateEntries) {
  await cp(new URL(entry, repositoryRoot), new URL(entry, templateRoot), { recursive: true });
}
