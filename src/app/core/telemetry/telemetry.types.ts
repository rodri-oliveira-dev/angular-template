export type TelemetryAttributeValue = string | number | boolean | null | undefined;

export type TelemetryAttributes = Readonly<Record<string, TelemetryAttributeValue>>;

export interface TelemetryPerformanceConfig {
  readonly enabled: boolean;
  readonly navigation?: boolean;
  readonly webVitals?: boolean;
}

export interface TelemetryConfig {
  readonly enabled: boolean;
  readonly mode: 'local' | 'noop';
  readonly localBufferSize?: number;
  readonly performance?: TelemetryPerformanceConfig;
}

export interface TelemetryEventRecord {
  readonly kind: 'event';
  readonly name: string;
  readonly timestamp: string;
  readonly attributes: TelemetryAttributes;
}

export interface TelemetryErrorRecord {
  readonly kind: 'error';
  readonly name: string;
  readonly errorType: string;
  readonly timestamp: string;
  readonly attributes: TelemetryAttributes;
}

export type TelemetryRecord = TelemetryEventRecord | TelemetryErrorRecord;
