import { ErrorHandler, Injectable, inject } from '@angular/core';

import { TelemetryClient } from './telemetry.client';

@Injectable()
export class TelemetryErrorHandler implements ErrorHandler {
  private readonly telemetry = inject(TelemetryClient);

  handleError(error: unknown): void {
    this.telemetry.error(error, {
      source: 'global',
    });
  }
}
