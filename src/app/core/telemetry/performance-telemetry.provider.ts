import {
  ENVIRONMENT_INITIALIZER,
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';

import { PerformanceTelemetryService } from './performance-telemetry.service';

export function providePerformanceTelemetry(): EnvironmentProviders {
  return makeEnvironmentProviders([
    PerformanceTelemetryService,
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        inject(PerformanceTelemetryService).start();
      },
    },
  ]);
}
