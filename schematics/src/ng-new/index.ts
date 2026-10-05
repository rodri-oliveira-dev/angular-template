import { strings } from '@angular-devkit/core';
import {
  MergeStrategy,
  Rule,
  Tree,
  apply,
  chain,
  externalSchematic,
  mergeWith,
  move,
  url,
} from '@angular-devkit/schematics';
import { applyEdits, modify } from 'jsonc-parser';
import { format } from 'prettier';

import type { NgNewSchema } from './schema';

interface NormalizedOptions {
  apiMode: 'mock' | 'bff';
  bffProxyTarget: string;
  coverageThreshold: number;
  e2e: boolean;
  displayName: string;
  observability: boolean;
  projectName: string;
  root: string;
  routing: boolean;
  style: 'css' | 'scss';
}

function workspacePath(root: string, file: string): string {
  return `/${root ? `${root}/` : ''}${file}`;
}

function readText(tree: Tree, path: string): string {
  const source = tree.read(path);
  if (!source) {
    throw new Error(`Expected generated file ${path}.`);
  }
  return source.toString('utf-8');
}

function overwriteText(tree: Tree, path: string, content: string): void {
  if (!tree.exists(path)) {
    throw new Error(`Expected generated file ${path}.`);
  }
  tree.overwrite(path, content);
}

function updateJsonc(
  tree: Tree,
  path: string,
  updates: ReadonlyArray<readonly [ReadonlyArray<string | number>, unknown]>,
): void {
  let content = readText(tree, path);
  for (const [jsonPath, value] of updates) {
    content = applyEdits(
      content,
      modify(content, [...jsonPath], value, {
        formattingOptions: { eol: '\n', insertSpaces: true, tabSize: 2 },
      }),
    );
  }
  overwriteText(tree, path, content);
}

function updateJson(
  tree: Tree,
  path: string,
  update: (value: Record<string, unknown>) => void,
): void {
  const source = tree.read(path);
  if (!source) {
    throw new Error(`Expected generated file ${path}.`);
  }

  const value = JSON.parse(source.toString('utf-8')) as Record<string, unknown>;
  update(value);
  tree.overwrite(path, `${JSON.stringify(value, null, 2)}\n`);
}

function deleteDirectory(tree: Tree, path: string): void {
  tree.getDir(path).visit((file) => tree.delete(file));
}

function guardAgainstReentry(root: string): Rule {
  return (tree) => {
    if (tree.exists(workspacePath(root, 'angular.json'))) {
      const destination = root || '.';
      throw new Error(
        `Cannot generate into "${destination}": an Angular workspace already exists there. Choose an empty directory.`,
      );
    }
    return tree;
  };
}

function removeYamlSteps(content: string, stepNames: Set<string>): string {
  const output: string[] = [];
  let skipping = false;

  for (const line of content.split(/\r?\n/)) {
    const step = /^      - name: (.+)$/.exec(line);
    if (step) {
      skipping = stepNames.has(step[1] ?? '');
    }
    if (!skipping && !/^          (PLAYWRIGHT_INSTALL_OUTCOME|E2E_OUTCOME):/.test(line)) {
      output.push(line);
    }
  }

  return output.join('\n');
}

function configureRouting(tree: Tree, options: NormalizedOptions): void {
  if (options.routing) {
    return;
  }

  const appRoot = workspacePath(options.root, 'src/app');
  const appConfigPath = `${appRoot}/app.config.ts`;
  const appConfig = readText(tree, appConfigPath)
    .replace(/import \{ provideRouter \} from '@angular\/router';\r?\n/, '')
    .replace(/import \{ routes \} from '\.\/app\.routes';\r?\n/, '')
    .replace(/    provideRouter\(routes\),\r?\n/, '');
  overwriteText(tree, appConfigPath, appConfig);

  overwriteText(
    tree,
    `${appRoot}/app.ts`,
    `import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ExamplePage } from './features/example/pages/example-page/example-page';

@Component({
  selector: 'app-root',
  imports: [ExamplePage],
  templateUrl: './app.html',
  styleUrl: './app.${options.style}',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
`,
  );
  overwriteText(
    tree,
    `${appRoot}/app.html`,
    `<header class="app-header">
  <span class="brand">Angular Template</span>
</header>

<main class="app-content">
  <app-example-page />
</main>
`,
  );
  overwriteText(
    tree,
    `${appRoot}/app.spec.ts`,
    `import { TestBed } from '@angular/core/testing';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('creates the application shell', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the application brand and reference feature', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.brand')?.textContent).toContain('Angular Template');
    expect(element.querySelector('app-example-page')).toBeTruthy();
  });
});
`,
  );
  tree.delete(`${appRoot}/app.routes.ts`);
  tree.delete(`${appRoot}/app.routes.spec.ts`);
}

function configureStyles(tree: Tree, options: NormalizedOptions): void {
  if (options.style === 'scss') {
    return;
  }

  const styleFiles = [
    'src/styles.scss',
    'src/app/app.scss',
    'src/app/features/example/components/boundary-card/boundary-card.scss',
    'src/app/features/example/pages/example-page/example-page.scss',
  ];
  for (const file of styleFiles) {
    const source = workspacePath(options.root, file);
    const destination = source.replace(/\.scss$/, '.css');
    if (tree.exists(source)) {
      if (tree.exists(destination)) {
        tree.delete(destination);
      }
      tree.rename(source, destination);
    } else if (!tree.exists(destination)) {
      throw new Error(`Expected the packaged style file ${source} or ${destination}.`);
    }
  }

  for (const file of [
    'src/app/app.ts',
    'src/app/features/example/components/boundary-card/boundary-card.ts',
    'src/app/features/example/pages/example-page/example-page.ts',
  ]) {
    const path = workspacePath(options.root, file);
    overwriteText(tree, path, readText(tree, path).replace(/\.scss'/g, ".css'"));
  }
}

function replaceKnownIdentity(
  tree: Tree,
  path: string,
  replacements: ReadonlyArray<readonly [string, string]>,
): void {
  let content = readText(tree, path);
  for (const [source, destination] of replacements) {
    content = content.replaceAll(source, destination);
  }
  overwriteText(tree, path, content);
}

function configureIdentity(tree: Tree, options: NormalizedOptions): void {
  const technicalReplacements = [
    ['coverage/angular-template', `coverage/${options.projectName}`],
    ['dist/angular-template', `dist/${options.projectName}`],
    ['/tmp/angular-template-http', `/tmp/${options.projectName}-http`],
    ["projects?.['angular-template']", `projects?.['${options.projectName}']`],
    ["'angular-template-bootstrap-'", `'${options.projectName}-bootstrap-'`],
    ['<!-- angular-template-ci-validation -->', `<!-- ${options.projectName}-ci-validation -->`],
  ] as const;
  for (const file of [
    '.github/workflows/ci.yml',
    'scripts/check-coverage-gate.mjs',
    'scripts/report-ci-pr-status.mjs',
    'scripts/serve-security-baseline.mjs',
    'scripts/verify-clean-bootstrap.mjs',
  ]) {
    replaceKnownIdentity(tree, workspacePath(options.root, file), technicalReplacements);
  }

  for (const file of [
    'README.md',
    'README.pt-BR.md',
    'docs/testing/README.md',
    'docs/pt-BR/testing/README.md',
    'docs/ci/README.md',
    'docs/pt-BR/ci/README.md',
  ]) {
    replaceKnownIdentity(tree, workspacePath(options.root, file), [
      ['angular-template.code-workspace', `${options.projectName}.code-workspace`],
      ['coverage/angular-template', `coverage/${options.projectName}`],
    ]);
  }

  for (const file of ['src/index.html', 'src/app/app.html', 'src/app/app.spec.ts']) {
    replaceKnownIdentity(tree, workspacePath(options.root, file), [
      ['Angular Template', options.displayName],
    ]);
  }

  const workspaceSource = workspacePath(options.root, 'angular-template.code-workspace');
  const workspaceDestination = workspacePath(options.root, `${options.projectName}.code-workspace`);
  if (tree.exists(workspaceSource)) {
    updateJsonc(tree, workspaceSource, [
      [['folders', 0, 'name'], options.projectName],
      [
        ['settings', 'code-coverage-lcov.path.searchPath'],
        `coverage/${options.projectName}/lcov.info`,
      ],
    ]);
    if (tree.exists(workspaceDestination)) {
      tree.delete(workspaceDestination);
    }
    tree.rename(workspaceSource, workspaceDestination);
  } else if (!tree.exists(workspaceDestination)) {
    throw new Error(`Expected the packaged VS Code workspace ${workspaceSource}.`);
  }
}

function configureE2e(tree: Tree, options: NormalizedOptions): void {
  const packagePath = workspacePath(options.root, 'package.json');
  const lockPath = workspacePath(options.root, 'package-lock.json');
  const workflowPath = workspacePath(options.root, '.github/workflows/ci.yml');

  if (!options.e2e) {
    updateJson(tree, packagePath, (packageJson) => {
      const scripts = packageJson['scripts'] as Record<string, string>;
      for (const script of Object.keys(scripts)) {
        if (script === 'e2e' || script.startsWith('e2e:')) {
          delete scripts[script];
        }
      }
      const ciVerify = scripts['ci:verify'];
      if (!ciVerify) {
        throw new Error('The packaged baseline does not define the ci:verify script.');
      }
      scripts['ci:verify'] = ciVerify.replace(/ && npm run e2e$/, '');
      const devDependencies = packageJson['devDependencies'] as Record<string, string>;
      delete devDependencies['@playwright/test'];
    });
    updateJson(tree, lockPath, (packageLock) => {
      const packages = packageLock['packages'] as Record<string, Record<string, unknown>>;
      const devDependencies = packages['']?.['devDependencies'] as Record<string, string>;
      delete devDependencies['@playwright/test'];
    });
    deleteDirectory(tree, workspacePath(options.root, 'e2e'));
    deleteDirectory(tree, workspacePath(options.root, 'e2e-bff'));
    tree.delete(workspacePath(options.root, 'playwright.config.ts'));
    tree.delete(workspacePath(options.root, 'playwright.bff.config.ts'));
    overwriteText(
      tree,
      workflowPath,
      removeYamlSteps(
        readText(tree, workflowPath),
        new Set([
          'Install Playwright Chromium',
          'Playwright E2E (mock + BFF)',
          'Upload Playwright diagnostics',
        ]),
      ),
    );
    return;
  }

  if (!options.routing) {
    const e2ePath = workspacePath(options.root, 'e2e/app.spec.ts');
    overwriteText(
      tree,
      e2ePath,
      `import { expect, test } from '@playwright/test';

test.describe('application smoke', () => {
  test('bootstraps the application shell', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Feature-first by default' })).toBeVisible();
  });

  test('completes the reference write flow with the local API mock', async ({ page }) => {
    await page.goto('/');
    const items = page.locator('.api-items li');
    await expect(items).toHaveCount(2);
    await page.getByRole('button', { name: 'Add example' }).click();
    await expect(items).toHaveCount(3);
    await expect(items.last()).toHaveText('Example 3');
  });
});
`,
    );
  }

  const playwrightPath = workspacePath(options.root, 'playwright.config.ts');
  overwriteText(
    tree,
    playwrightPath,
    readText(tree, playwrightPath).replace(
      "command: 'npm start -- --host 127.0.0.1 --port 4200'",
      "command: 'npm run start:mock -- --host 127.0.0.1 --port 4200'",
    ),
  );
}

function configureGeneratedWorkspace(options: NormalizedOptions): Rule {
  return (tree) => {
    tree.delete(workspacePath(options.root, '.prettierrc'));
    deleteDirectory(tree, workspacePath(options.root, '.vscode'));

    updateJson(tree, workspacePath(options.root, 'package.json'), (packageJson) => {
      packageJson['name'] = options.projectName;
      packageJson['version'] = '0.0.0';
      packageJson['private'] = true;

      const scripts = packageJson['scripts'] as Record<string, string>;
      for (const script of Object.keys(scripts)) {
        if (script.startsWith('schematics:')) {
          delete scripts[script];
        }
      }
    });

    updateJson(tree, workspacePath(options.root, 'package-lock.json'), (packageLock) => {
      packageLock['name'] = options.projectName;
      packageLock['version'] = '0.0.0';
      const packages = packageLock['packages'] as Record<string, Record<string, unknown>>;
      const rootPackage = packages[''];
      if (!rootPackage) {
        throw new Error('The packaged lockfile does not define its root package.');
      }
      rootPackage['name'] = options.projectName;
      rootPackage['version'] = '0.0.0';
    });

    updateJson(tree, workspacePath(options.root, 'angular.json'), (angularJson) => {
      const projects = angularJson['projects'] as Record<string, Record<string, unknown>>;
      const baseline = projects['angular-template'] ?? projects[options.projectName];
      if (!baseline) {
        throw new Error('The packaged baseline does not define the angular-template project.');
      }

      const architect = baseline['architect'] as Record<string, Record<string, unknown>>;
      const serveTarget = architect['serve'];
      if (!serveTarget) {
        throw new Error('The packaged baseline does not define the Angular serve target.');
      }
      const serve = serveTarget['configurations'] as Record<string, Record<string, unknown>>;
      for (const configuration of Object.values(serve)) {
        if (typeof configuration['buildTarget'] === 'string') {
          configuration['buildTarget'] = configuration['buildTarget'].replace(
            'angular-template:',
            `${options.projectName}:`,
          );
        }
      }

      delete projects['angular-template'];
      projects[options.projectName] = baseline;

      const schematics = baseline['schematics'] as Record<string, Record<string, unknown>>;
      const componentSchematic = schematics['@schematics/angular:component'];
      if (!componentSchematic) {
        throw new Error('The packaged baseline does not define Angular component defaults.');
      }
      componentSchematic['style'] = options.style;
      const build = architect['build'];
      if (!build) {
        throw new Error('The packaged baseline does not define the Angular build target.');
      }
      const buildOptions = build['options'] as Record<string, unknown>;
      buildOptions['inlineStyleLanguage'] = options.style;
      buildOptions['styles'] = [`src/styles.${options.style}`];

      if (options.apiMode === 'bff') {
        serveTarget['defaultConfiguration'] = 'bff';
      }

      const test = architect['test'];
      const testOptions = test?.['options'] as Record<string, unknown>;
      testOptions['coverageThresholds'] = {
        statements: options.coverageThreshold,
        branches: options.coverageThreshold,
        functions: options.coverageThreshold,
        lines: options.coverageThreshold,
      };
    });

    updateJson(tree, workspacePath(options.root, 'src/proxy.bff.conf.json'), (proxy) => {
      const apiProxy = proxy['/api/**'] as Record<string, unknown>;
      apiProxy['target'] = options.bffProxyTarget;
    });

    const appConfigPath = workspacePath(options.root, 'src/app/app.config.ts');
    if (!options.observability) {
      overwriteText(
        tree,
        appConfigPath,
        readText(tree, appConfigPath).replace('      enabled: true,', '      enabled: false,'),
      );
    }

    const coverageScriptPath = workspacePath(options.root, 'scripts/check-coverage-gate.mjs');
    overwriteText(
      tree,
      coverageScriptPath,
      readText(tree, coverageScriptPath).replace(
        "process.env.COVERAGE_GATE ?? '85'",
        `process.env.COVERAGE_GATE ?? '${options.coverageThreshold}'`,
      ),
    );
    const workflowPath = workspacePath(options.root, '.github/workflows/ci.yml');
    overwriteText(
      tree,
      workflowPath,
      readText(tree, workflowPath).replace(
        /COVERAGE_GATE: 85/g,
        `COVERAGE_GATE: ${options.coverageThreshold}`,
      ),
    );

    configureStyles(tree, options);
    configureRouting(tree, options);
    configureE2e(tree, options);
    configureIdentity(tree, options);

    const gitignoreTemplatePath = workspacePath(options.root, 'gitignore.template');
    const gitignorePath = workspacePath(options.root, '.gitignore');
    if (!tree.exists(gitignoreTemplatePath)) {
      throw new Error(`Expected packaged template file ${gitignoreTemplatePath}.`);
    }
    if (tree.exists(gitignorePath)) {
      tree.delete(gitignorePath);
    }
    tree.rename(gitignoreTemplatePath, gitignorePath);
    tree.overwrite(
      gitignorePath,
      readText(tree, gitignorePath)
        .split(/\r?\n/)
        .filter((line: string) => !line.startsWith('/schematics/'))
        .join('\n'),
    );

    return tree;
  };
}

function formatTransformedFiles(options: NormalizedOptions): Rule {
  return async (tree) => {
    const files = [
      '.github/workflows/ci.yml',
      'angular.json',
      'package.json',
      `${options.projectName}.code-workspace`,
      'scripts/check-coverage-gate.mjs',
      'scripts/report-ci-pr-status.mjs',
      'scripts/serve-security-baseline.mjs',
      'scripts/verify-clean-bootstrap.mjs',
      'src/app/app.config.ts',
      'src/app/app.html',
      'src/app/app.spec.ts',
      'src/app/app.ts',
      'src/proxy.bff.conf.json',
    ];
    if (options.e2e) {
      files.push('e2e/app.spec.ts', 'playwright.config.ts');
    }

    for (const file of files) {
      const path = workspacePath(options.root, file);
      if (tree.exists(path)) {
        tree.overwrite(
          path,
          await format(readText(tree, path), {
            filepath: file,
            printWidth: 100,
            semi: true,
            singleQuote: true,
            trailingComma: 'all',
          }),
        );
      }
    }
    return tree;
  };
}

/** Compose Angular CLI workspace generation with the production-ready template baseline. */
export function ngNew(options: NgNewSchema): Rule {
  const projectName = strings.dasherize(options.name);
  const requestedDirectory = options.directory ?? projectName;
  const normalizedDirectory = requestedDirectory.replace(/\\/g, '/');
  if (
    normalizedDirectory.startsWith('/') ||
    /^[A-Za-z]:\//.test(normalizedDirectory) ||
    normalizedDirectory.split('/').includes('..')
  ) {
    throw new Error(
      `directory must stay within the current working directory; received "${requestedDirectory}".`,
    );
  }
  const root = normalizedDirectory
    .replace(/^\.\/?$/, '')
    .replace(/^\.\//, '')
    .replace(/\/$/, '');
  const bffProxyTarget = options.bffProxyTarget ?? 'http://localhost:5000';
  let parsedTarget: URL;
  try {
    parsedTarget = new URL(bffProxyTarget);
  } catch {
    throw new Error(
      `bffProxyTarget must be an absolute HTTP(S) URL; received "${bffProxyTarget}".`,
    );
  }
  if (
    !['http:', 'https:'].includes(parsedTarget.protocol) ||
    parsedTarget.username ||
    parsedTarget.password
  ) {
    throw new Error('bffProxyTarget must use HTTP(S) and must not contain credentials.');
  }

  const normalized: NormalizedOptions = {
    apiMode: options.apiMode ?? 'mock',
    bffProxyTarget,
    coverageThreshold: options.coverageThreshold ?? 85,
    displayName: projectName
      .split('-')
      .filter(Boolean)
      .map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`)
      .join(' '),
    e2e: options.e2e ?? true,
    observability: options.observability ?? true,
    projectName,
    root,
    routing: options.routing ?? true,
    style: options.style ?? 'scss',
  };

  return chain([
    guardAgainstReentry(root),
    externalSchematic('@schematics/angular', 'ng-new', {
      name: projectName,
      directory: options.directory,
      packageManager: 'npm',
      routing: normalized.routing,
      skipGit: options.skipGit ?? false,
      skipInstall: options.skipInstall ?? false,
      standalone: true,
      strict: true,
      style: normalized.style,
      version: options.version ?? '22.2.1',
    }),
    mergeWith(apply(url('./files'), [move(root)]), MergeStrategy.Overwrite),
    configureGeneratedWorkspace(normalized),
    formatTransformedFiles(normalized),
  ]);
}
