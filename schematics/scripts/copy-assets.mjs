import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';

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

await rm(new URL('.github/workflows/publish-schematics.yml', templateRoot), { force: true });
const applicationCiUrl = new URL('.github/workflows/ci.yml', templateRoot);
const applicationCi = await readFile(applicationCiUrl, 'utf-8');
await writeFile(applicationCiUrl, applicationCi.replace(/\r?\n  schematics:\r?\n[\s\S]*$/, '\n'));

async function normalizeTextFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryUrl = new URL(entry.name, directory);
    if (entry.isDirectory()) {
      await normalizeTextFiles(new URL(`${entry.name}/`, directory));
      continue;
    }

    const content = await readFile(entryUrl);
    if (!content.includes(0)) {
      await writeFile(entryUrl, content.toString('utf-8').replace(/\r\n/g, '\n'));
    }
  }
}

await normalizeTextFiles(templateRoot);
