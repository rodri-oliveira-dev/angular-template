import { TelemetryAttributes } from './telemetry.types';

export abstract class TelemetryClient {
  abstract event(name: string, attributes?: TelemetryAttributes): void;

  abstract error(error: unknown, attributes?: TelemetryAttributes): void;
}
