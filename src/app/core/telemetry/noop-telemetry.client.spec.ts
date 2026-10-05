import { NoopTelemetryClient } from './noop-telemetry.client';

describe('NoopTelemetryClient', () => {
  it('accepts events without side effects', () => {
    const client = new NoopTelemetryClient();

    expect(() => client.event()).not.toThrow();
  });

  it('accepts errors without side effects', () => {
    const client = new NoopTelemetryClient();

    expect(() => client.error()).not.toThrow();
  });
});
