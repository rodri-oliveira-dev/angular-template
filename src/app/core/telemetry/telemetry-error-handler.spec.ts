import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { TelemetryClient } from './telemetry.client';
import { TelemetryErrorHandler } from './telemetry-error-handler';

describe('TelemetryErrorHandler', () => {
  it('forwards unexpected errors to the telemetry abstraction', () => {
    const telemetry = {
      event: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TelemetryErrorHandler,
        {
          provide: TelemetryClient,
          useValue: telemetry,
        },
      ],
    });

    const error = new Error('unexpected');

    TestBed.inject(TelemetryErrorHandler).handleError(error);

    expect(telemetry.error).toHaveBeenCalledWith(error, {
      source: 'global',
    });
  });
});
