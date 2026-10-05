import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(command, args, cwd, capture = false) {
  return new Promise((resolve, reject) => {
    const output = [];
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, CI: 'true', NO_COLOR: '1' },
      shell: process.platform === 'win32',
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    });

    if (capture) {
      child.stdout.on('data', (chunk) => output.push(chunk));
    }
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve(Buffer.concat(output).toString('utf-8'));
        return;
      }
      reject(
        new Error(
          `${command} ${args.join(' ')} failed with ${signal ? `signal ${signal}` : `exit code ${code}`}.`,
        ),
      );
    });
  });
}

async function stage(name, action) {
  console.log(`\n[integration] ${name}`);
  try {
    return await action();
  } catch (error) {
    throw new Error(`Generated-project integration failed during "${name}".`, { cause: error });
  }
}

const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'rodri-schematics-integration-'));
const artifactRoot = path.join(temporaryRoot, 'artifacts');
const consumerRoot = path.join(temporaryRoot, 'consumer');
const generatedRoot = path.join(consumerRoot, 'schematics-consumer');
const generatedBffRoot = path.join(consumerRoot, 'schematics-bff-consumer');

try {
  await mkdir(artifactRoot, { recursive: true });
  await mkdir(consumerRoot, { recursive: true });
  await writeFile(
    path.join(consumerRoot, 'package.json'),
    `${JSON.stringify({ name: 'schematics-integration-host', private: true, version: '0.0.0' }, null, 2)}\n`,
  );

  const packOutput = await stage('pack local collection', () =>
    run(npmCommand, ['pack', '--silent', '--pack-destination', artifactRoot], packageRoot, true),
  );
  const filename = packOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .findLast((line) => line.endsWith('.tgz'));
  if (!filename) {
    throw new Error('npm pack did not report an artifact filename.');
  }
  const artifactPath = path.join(artifactRoot, filename);

  await stage('install Angular CLI and packed collection in consumer host', () =>
    run(npmCommand, ['install', '--save-dev', '@angular/cli@22.2.1', artifactPath], consumerRoot),
  );
  await stage('generate application through the installed collection', () =>
    run(
      npxCommand,
      [
        '--no-install',
        'ng',
        'new',
        'schematics-consumer',
        '--collection=@rodri/angular-template',
        '--defaults',
        '--skip-git',
        '--skip-install',
      ],
      consumerRoot,
    ),
  );

  const generatedPackage = JSON.parse(
    await readFile(path.join(generatedRoot, 'package.json'), 'utf-8'),
  );
  if (generatedPackage.name !== 'schematics-consumer') {
    throw new Error(`Unexpected generated package name: ${generatedPackage.name}.`);
  }
  const generatedGitignore = await readFile(path.join(generatedRoot, '.gitignore'), 'utf-8');
  if (
    !generatedGitignore.includes('/playwright-report-bff/') ||
    !generatedGitignore.includes('/report_html.html') ||
    generatedGitignore.includes('/schematics/')
  ) {
    throw new Error('Generated .gitignore does not match the packaged application template.');
  }

  const npmStages = [
    ['clean dependency install', ['ci']],
    ['format check', ['run', 'format:check']],
    ['lint and architecture/security guardrails', ['run', 'lint']],
    ['security tests and audit', ['run', 'security:all']],
    ['unit tests with coverage', ['run', 'test:coverage']],
    ['coverage gate', ['run', 'coverage:check']],
    ['production build', ['run', 'build']],
    ['clean bootstrap verification', ['run', 'bootstrap:verify']],
  ];
  for (const [name, args] of npmStages) {
    await stage(name, () => run(npmCommand, args, generatedRoot));
  }

  await stage('install Playwright Chromium', () =>
    run(
      npxCommand,
      [
        '--no-install',
        'playwright',
        'install',
        ...(process.env.CI ? ['--with-deps'] : []),
        'chromium',
      ],
      generatedRoot,
    ),
  );
  await stage('Playwright mock and BFF modes', () =>
    run(npmCommand, ['run', 'e2e'], generatedRoot),
  );

  await stage('generate a BFF-first application through the installed collection', () =>
    run(
      npxCommand,
      [
        '--no-install',
        'ng',
        'new',
        'schematics-bff-consumer',
        '--collection=@rodri/angular-template',
        '--api-mode=bff',
        '--defaults',
        '--skip-git',
        '--skip-install',
      ],
      consumerRoot,
    ),
  );
  await stage('install BFF-first application dependencies', () =>
    run(npmCommand, ['ci'], generatedBffRoot),
  );
  await stage('Playwright mock and BFF modes for a BFF-first application', () =>
    run(npmCommand, ['run', 'e2e'], generatedBffRoot),
  );

  console.log('\nGenerated-project integration passed.');
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}
