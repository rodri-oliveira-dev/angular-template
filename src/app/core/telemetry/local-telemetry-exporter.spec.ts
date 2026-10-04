import { vi } from 'vitest';

import { LocalTelemetryClient } from './local-telemetry.client';
import { TelemetryExporter } from './telemetry-exporter';

describe('LocalTelemetryClient exporter', () => {
  it('forwards sanitized records to an optional exporter', () => {
    const exporter: TelemetryExporter = {
      export: vi.fn(),
    };
    const client = new LocalTelemetryClient(10, exporter);

    client.event('example.event', {
      route: '/example',
      token: 'must-not-leak',
    });

    expect(exporter.export).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'event',
        name: 'example.event',
        attributes: {
          route: '/example',
        },
      }),
    );
  });
  it('isolates application flow and buffer pruning from exporter failures', () => {
    const exporter: TelemetryExporter = {
      export: vi.fn(() => {
        throw new Error('exporter unavailable');
      }),
    };
    const client = new LocalTelemetryClient(2, exporter);

    expect(() => client.event('first')).not.toThrow();
    expect(() => client.event('second')).not.toThrow();
    expect(() => client.event('third')).not.toThrow();

    expect(client.snapshot().map((record) => record.name)).toEqual(['second', 'third']);
    expect(exporter.export).toHaveBeenCalledTimes(3);
  });
});
