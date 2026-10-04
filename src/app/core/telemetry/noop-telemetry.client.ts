import { TelemetryClient } from './telemetry.client';

export class NoopTelemetryClient extends TelemetryClient {
  override event(): void {}

  override error(): void {}
}
