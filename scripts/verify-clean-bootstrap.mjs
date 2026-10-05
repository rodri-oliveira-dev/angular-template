import { spawn } from 'node:child_process';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excludedRoots = new Set([
  '.angular',
  '.git',
  'coverage',
  'dist',
  'node_modules',
  'out-tsc',
  'playwright-report',
  'playwright-report-bff',
  'test-results',
  'tmp',
]);

export function shouldCopy(source) {
  const relative = path.relative(repositoryRoot, source);

  if (!relative) {
    return true;
  }

  const [root] = relative.split(path.sep);
  return !excludedRoots.has(root);
}

function runNpm(args, cwd) {
  const npmCli = process.env.npm_execpath;
  const command = npmCli ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const commandArgs = npmCli ? [npmCli, ...args] : args;

  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd,
      env: { ...process.env, CI: 'true' },
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `npm ${args.join(' ')} failed with ${signal ? `signal ${signal}` : `exit code ${code}`}.`,
        ),
      );
    });
  });
}

export async function verifyCleanBootstrap() {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'angular-template-bootstrap-'));
  const projectRoot = path.join(temporaryRoot, 'project');

  try {
    console.log(`Creating clean template copy at ${projectRoot}`);
    await cp(repositoryRoot, projectRoot, {
      recursive: true,
      filter: shouldCopy,
    });

    await runNpm(['ci'], projectRoot);
    await runNpm(['run', 'build'], projectRoot);

    console.log('Clean template bootstrap succeeded.');
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  verifyCleanBootstrap().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
