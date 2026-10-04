import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

import { LocalTelemetryClient } from './local-telemetry.client';
import { NoopTelemetryClient } from './noop-telemetry.client';
import { TelemetryClient } from './telemetry.client';
import { TelemetryConfig } from './telemetry.types';

export const TELEMETRY_CONFIG = new InjectionToken<TelemetryConfig>('TELEMETRY_CONFIG');

export function provideTelemetry(config: TelemetryConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: TELEMETRY_CONFIG,
      useValue: config,
    },
    {
      provide: TelemetryClient,
      useFactory: () => {
        if (!config.enabled || config.mode === 'noop') {
          return new NoopTelemetryClient();
        }

        return new LocalTelemetryClient(config.localBufferSize ?? 100);
      },
    },
  ]);
}
