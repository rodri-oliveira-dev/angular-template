import { TestBed } from '@angular/core/testing';

import { LocalTelemetryClient } from './local-telemetry.client';
import { NoopTelemetryClient } from './noop-telemetry.client';
import { TelemetryClient } from './telemetry.client';
import { provideTelemetry } from './telemetry.provider';

describe('provideTelemetry', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('provides the local implementation when enabled in local mode', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTelemetry({
          enabled: true,
          mode: 'local',
        }),
      ],
    });

    expect(TestBed.inject(TelemetryClient)).toBeInstanceOf(LocalTelemetryClient);
  });

  it('provides the no-op implementation when telemetry is disabled', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTelemetry({
          enabled: false,
          mode: 'local',
        }),
      ],
    });

    expect(TestBed.inject(TelemetryClient)).toBeInstanceOf(NoopTelemetryClient);
  });
});
