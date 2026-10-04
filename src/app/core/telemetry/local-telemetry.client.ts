import { Injectable } from '@angular/core';

import { TelemetryClient } from './telemetry.client';
import { sanitizeTelemetryAttributes } from './telemetry-sanitizer';
import {
  TelemetryAttributes,
  TelemetryErrorRecord,
  TelemetryEventRecord,
  TelemetryRecord,
} from './telemetry.types';

@Injectable()
export class LocalTelemetryClient extends TelemetryClient {
  private readonly records: TelemetryRecord[] = [];

  constructor(private readonly bufferSize = 100) {
    super();
  }

  override event(name: string, attributes?: TelemetryAttributes): void {
    const record: TelemetryEventRecord = {
      kind: 'event',
      name,
      timestamp: new Date().toISOString(),
      attributes: sanitizeTelemetryAttributes(attributes),
    };

    this.append(record);
  }

  override error(error: unknown, attributes?: TelemetryAttributes): void {
    const record: TelemetryErrorRecord = {
      kind: 'error',
      name: 'application.error',
      errorType: errorType(error),
      timestamp: new Date().toISOString(),
      attributes: sanitizeTelemetryAttributes(attributes),
    };

    this.append(record);
  }

  snapshot(): readonly TelemetryRecord[] {
    return this.records.map((record) => ({
      ...record,
      attributes: { ...record.attributes },
    }));
  }

  private append(record: TelemetryRecord): void {
    this.records.push(record);

    if (this.records.length > this.bufferSize) {
      this.records.splice(0, this.records.length - this.bufferSize);
    }
  }
}

function errorType(error: unknown): string {
  if (error instanceof Error && error.name) {
    return error.name;
  }

  if (error === null) {
    return 'null';
  }

  return typeof error;
}
