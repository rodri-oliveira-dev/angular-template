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

import type { NgNewSchema } from './schema';

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

function configureGeneratedWorkspace(root: string, projectName: string): Rule {
  return (tree) => {
    updateJson(tree, `/${root}/package.json`, (packageJson) => {
      packageJson['name'] = projectName;
      packageJson['version'] = '0.0.0';
      packageJson['private'] = true;

      const scripts = packageJson['scripts'] as Record<string, string>;
      for (const script of Object.keys(scripts)) {
        if (script.startsWith('schematics:')) {
          delete scripts[script];
        }
      }
    });

    updateJson(tree, `/${root}/package-lock.json`, (packageLock) => {
      packageLock['name'] = projectName;
      packageLock['version'] = '0.0.0';
      const packages = packageLock['packages'] as Record<string, Record<string, unknown>>;
      const rootPackage = packages[''];
      if (!rootPackage) {
        throw new Error('The packaged lockfile does not define its root package.');
      }
      rootPackage['name'] = projectName;
      rootPackage['version'] = '0.0.0';
    });

    updateJson(tree, `/${root}/angular.json`, (angularJson) => {
      const projects = angularJson['projects'] as Record<string, Record<string, unknown>>;
      const baseline = projects['angular-template'];
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
            `${projectName}:`,
          );
        }
      }

      delete projects['angular-template'];
      projects[projectName] = baseline;
    });

    const gitignorePath = `/${root}/.gitignore`;
    const gitignore = tree.read(gitignorePath)?.toString('utf-8');
    if (gitignore) {
      tree.overwrite(
        gitignorePath,
        gitignore
          .split(/\r?\n/)
          .filter((line: string) => !line.startsWith('/schematics/'))
          .join('\n'),
      );
    }

    return tree;
  };
}

/** Compose Angular CLI workspace generation with the production-ready template baseline. */
export function ngNew(options: NgNewSchema): Rule {
  const projectName = strings.dasherize(options.name);
  const root = options.directory ?? projectName;

  return chain([
    externalSchematic('@schematics/angular', 'ng-new', {
      name: projectName,
      directory: options.directory,
      packageManager: 'npm',
      routing: true,
      skipGit: options.skipGit ?? false,
      skipInstall: options.skipInstall ?? false,
      standalone: true,
      strict: true,
      style: 'scss',
      version: '22.2.1',
    }),
    mergeWith(apply(url('./files'), [move(root)]), MergeStrategy.Overwrite),
    configureGeneratedWorkspace(root, projectName),
  ]);
}
