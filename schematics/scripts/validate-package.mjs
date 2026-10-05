import { spawn } from 'node:child_process';
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCli = process.env.npm_execpath;
const npmCommand = npmCli ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';

function runNpm(args, cwd, capture = false) {
  const commandArgs = npmCli ? [npmCli, ...args] : args;
  return new Promise((resolve, reject) => {
    const output = [];
    const child = spawn(npmCommand, commandArgs, {
      cwd,
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    });
    if (capture) {
      child.stdout.on('data', (chunk) => output.push(chunk));
    }
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(output).toString('utf-8'));
      } else {
        reject(new Error(`npm ${args.join(' ')} failed with exit code ${code}.`));
      }
    });
  });
}

const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'rodri-schematics-package-'));
const artifactRoot = path.join(temporaryRoot, 'artifacts');
const consumerRoot = path.join(temporaryRoot, 'consumer');

try {
  await mkdir(artifactRoot, { recursive: true });
  const result = JSON.parse(
    await runNpm(
      ['pack', '--ignore-scripts', '--json', '--pack-destination', artifactRoot],
      packageRoot,
      true,
    ),
  )[0];
  if (!result?.filename || !Array.isArray(result.files)) {
    throw new Error('npm pack did not return an inspectable package manifest.');
  }

  const paths = result.files.map((file) => file.path).sort();
  const required = [
    'README.md',
    'dist/collection.json',
    'dist/ng-new/index.js',
    'dist/ng-new/schema.json',
    'dist/ng-new/files/angular.json',
    'dist/ng-new/files/package.json',
    'dist/ng-new/files/src/main.ts',
    'package.json',
  ];
  for (const requiredPath of required) {
    if (!paths.includes(requiredPath)) {
      throw new Error(`Packed artifact is missing ${requiredPath}.`);
    }
  }
  const unexpected = paths.filter(
    (file) => file !== 'README.md' && file !== 'package.json' && !file.startsWith('dist/'),
  );
  if (unexpected.length > 0) {
    throw new Error(`Packed artifact contains internal files: ${unexpected.join(', ')}.`);
  }
  if (paths.some((file) => /\.(?:d\.ts|map)$/.test(file))) {
    throw new Error('Packed artifact contains non-runtime compiler output.');
  }

  console.log(`Inspected ${paths.length} packed files (${result.size} bytes):`);
  for (const file of paths) {
    console.log(`- ${file}`);
  }

  await mkdir(consumerRoot, { recursive: true });
  await writeFile(
    path.join(consumerRoot, 'package.json'),
    `${JSON.stringify({ name: 'package-validation-consumer', private: true }, null, 2)}\n`,
  );
  await runNpm(
    ['install', '--ignore-scripts', path.join(artifactRoot, result.filename)],
    consumerRoot,
  );

  const installedRoot = path.join(consumerRoot, 'node_modules', '@rodri', 'angular-template');
  const installedPackage = JSON.parse(
    await readFile(path.join(installedRoot, 'package.json'), 'utf-8'),
  );
  if (installedPackage.schematics !== './dist/collection.json') {
    throw new Error(`Unexpected schematics metadata: ${installedPackage.schematics}.`);
  }
  const collectionPath = path.join(installedRoot, 'dist', 'collection.json');
  const collection = JSON.parse(await readFile(collectionPath, 'utf-8'));
  if (collection.schematics?.['ng-new']?.factory !== './ng-new/index#ngNew') {
    throw new Error('Installed collection does not expose the expected ng-new factory.');
  }
  await access(path.join(installedRoot, 'dist', 'ng-new', 'index.js'));

  console.log('Packed artifact installs cleanly and exposes the ng-new collection.');
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}
