import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ArchitectureBoundary } from '../../models/architecture-boundary';

@Component({
  selector: 'app-boundary-card',
  templateUrl: './boundary-card.html',
  styleUrl: './boundary-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoundaryCard {
  readonly boundary = input.required<ArchitectureBoundary>();
}
