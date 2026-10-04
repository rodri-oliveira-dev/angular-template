import { TelemetryExporter } from './telemetry-exporter';
import { TelemetryAttributes, TelemetryRecord } from './telemetry.types';

export interface OpenTelemetryBridge {
  recordEvent(name: string, attributes: TelemetryAttributes): void;
  recordError(name: string, errorType: string, attributes: TelemetryAttributes): void;
}

export class OpenTelemetryTelemetryExporter implements TelemetryExporter {
  constructor(private readonly bridge: OpenTelemetryBridge) {}

  export(record: TelemetryRecord): void {
    if (record.kind === 'event') {
      this.bridge.recordEvent(record.name, record.attributes);
      return;
    }

    this.bridge.recordError(record.name, record.errorType, record.attributes);
  }
}
