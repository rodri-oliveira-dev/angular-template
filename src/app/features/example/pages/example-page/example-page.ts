import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, finalize } from 'rxjs';

import { ApiError } from '../../../../core/http/api-error';
import { BoundaryCard } from '../../components/boundary-card/boundary-card';
import { ExampleApiClient } from '../../data-access/example-api-client';
import { ArchitectureBoundary } from '../../models/architecture-boundary';
import { ExampleItem } from '../../models/example-item';

@Component({
  selector: 'app-example-page',
  imports: [BoundaryCard],
  templateUrl: './example-page.html',
  styleUrl: './example-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamplePage {
  private readonly apiClient = inject(ExampleApiClient);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly items = signal<readonly ExampleItem[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

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

  constructor() {
    this.loadExamples();
  }

  protected reloadExamples(): void {
    this.loadExamples();
  }

  protected addExample(): void {
    const label = `Example ${this.items().length + 1}`;

    this.beginRequest();

    this.apiClient
      .create(label)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error: unknown) => this.handleError(error)),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((createdItem) => {
        this.items.update((items) => [...items, createdItem]);
      });
  }

  private loadExamples(): void {
    this.beginRequest();

    this.apiClient
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error: unknown) => this.handleError(error)),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((items) => {
        this.items.set(items);
      });
  }

  private beginRequest(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);
  }

  private handleError(error: unknown) {
    const message =
      error instanceof ApiError
        ? (error.problemDetails?.detail ?? error.message)
        : 'Unexpected error while contacting the API.';

    this.errorMessage.set(message);

    return EMPTY;
  }
}
