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
await cp(new URL('.gitignore', repositoryRoot), new URL('gitignore.template', templateRoot));

for (const workflow of ['publish-schematics.yml', 'release.yml', 'initialize-template.yml']) {
  await rm(new URL(`.github/workflows/${workflow}`, templateRoot), { force: true });
}
await rm(new URL('.github/workflows/pages.yml', templateRoot), { force: true });
await rm(new URL('scripts/prepare-pages.mjs', templateRoot), { force: true });

const templateAngularUrl = new URL('angular.json', templateRoot);
const templateAngular = JSON.parse(await readFile(templateAngularUrl, 'utf-8'));
delete templateAngular.projects?.['angular-template']?.architect?.build?.configurations?.pages;
await writeFile(templateAngularUrl, `${JSON.stringify(templateAngular, null, 2)}\n`);

const templatePackageUrl = new URL('package.json', templateRoot);
const templatePackage = JSON.parse(await readFile(templatePackageUrl, 'utf-8'));
delete templatePackage.scripts?.['build:pages'];
await writeFile(templatePackageUrl, `${JSON.stringify(templatePackage, null, 2)}\n`);

async function removeRepositoryPagesDocumentation(file, introPrefix, sectionStart, sectionEnd) {
  const fileUrl = new URL(file, templateRoot);
  let content = await readFile(fileUrl, 'utf-8');
  content = content
    .split(/\r?\n/)
    .filter((line) => !line.startsWith('[![GitHub Pages]'))
    .join('\n');

  const introStart = content.indexOf(introPrefix);
  if (introStart >= 0) {
    const introEnd = content.indexOf('\n\n', introStart);
    if (introEnd < 0) {
      throw new Error(`Expected a complete GitHub Pages introduction in ${file}.`);
    }
    content = content.slice(0, introStart) + content.slice(introEnd + 2);
  }

  const pagesStart = content.indexOf(sectionStart);
  const pagesEnd = content.indexOf(sectionEnd, pagesStart);
  if (pagesStart < 0 || pagesEnd < 0) {
    throw new Error(`Expected the repository GitHub Pages section in ${file}.`);
  }

  await writeFile(fileUrl, content.slice(0, pagesStart) + content.slice(pagesEnd));
}

await removeRepositoryPagesDocumentation(
  'README.md',
  '**Live demo:**',
  '### GitHub Pages live demo\n',
  '## Validation\n',
);
await removeRepositoryPagesDocumentation(
  'README.pt-BR.md',
  '**Demo online:**',
  '### Demo online no GitHub Pages\n',
  '## Validação\n',
);
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
