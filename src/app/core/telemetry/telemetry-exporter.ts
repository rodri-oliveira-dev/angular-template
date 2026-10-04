import { TelemetryRecord } from './telemetry.types';

export interface TelemetryExporter {
  export(record: TelemetryRecord): void;
}

export class NoopTelemetryExporter implements TelemetryExporter {
  export(): void {}
}
