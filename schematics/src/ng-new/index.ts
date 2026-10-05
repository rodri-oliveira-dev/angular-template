import { Rule } from '@angular-devkit/schematics';

import type { NgNewSchema } from './schema';

/** Entry point composed by the application-generation implementation. */
export function ngNew(_options: NgNewSchema): Rule {
  return (tree) => tree;
}
