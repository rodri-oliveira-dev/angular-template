import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf-8'),
);
const version = packageJson.version;
const tag = process.env.RELEASE_TAG ?? process.env.GITHUB_REF_NAME;

if (!version || !tag) {
  console.error(
    'Release validation requires a package version and RELEASE_TAG or GITHUB_REF_NAME.',
  );
  process.exit(1);
}

if (tag !== `v${version}`) {
  console.error(
    `Release tag ${tag} does not match package version ${version} (expected v${version}).`,
  );
  process.exit(1);
}

console.log(`Release tag ${tag} matches @rodri-oliveira-dev/angular-template ${version}.`);
