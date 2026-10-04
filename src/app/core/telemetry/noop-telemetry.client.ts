import { Injectable } from '@angular/core';

import { TelemetryClient } from './telemetry.client';
import { TelemetryAttributes } from './telemetry.types';

@Injectable()
export class NoopTelemetryClient extends TelemetryClient {
  override event(_name: string, _attributes?: TelemetryAttributes): void {}

  override error(_error: unknown, _attributes?: TelemetryAttributes): void {}
}
