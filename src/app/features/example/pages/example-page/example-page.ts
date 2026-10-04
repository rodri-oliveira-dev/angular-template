import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BoundaryCard } from '../../components/boundary-card/boundary-card';
import { ArchitectureBoundary } from '../../models/architecture-boundary';

@Component({
  selector: 'app-example-page',
  imports: [BoundaryCard],
  templateUrl: './example-page.html',
  styleUrl: './example-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamplePage {
  protected readonly boundaries: readonly ArchitectureBoundary[] = [
    {
      name: 'Core',
      purpose: 'Application-wide infrastructure and singleton configuration.',
      examples: ['providers', 'guards', 'interceptors'],
    },
    {
      name: 'Shared',
      purpose: 'Reusable presentation and utilities with no feature ownership.',
      examples: ['components', 'directives', 'pipes'],
    },
    {
      name: 'Features',
      purpose: 'Business capabilities that own their UI, models, and data access.',
      examples: ['pages', 'components', 'models', 'data-access'],
    },
  ];
}
