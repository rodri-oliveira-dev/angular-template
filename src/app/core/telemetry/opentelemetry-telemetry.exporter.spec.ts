import { vi } from 'vitest';

import {
  OpenTelemetryBridge,
  OpenTelemetryTelemetryExporter,
} from './opentelemetry-telemetry.exporter';

describe('OpenTelemetryTelemetryExporter', () => {
  it('adapts structured events without requiring an SDK or collector', () => {
    const bridge: OpenTelemetryBridge = {
      recordEvent: vi.fn(),
      recordError: vi.fn(),
    };
    const exporter = new OpenTelemetryTelemetryExporter(bridge);

    exporter.export({
      kind: 'event',
      name: 'navigation.completed',
      timestamp: '2026-10-04T00:00:00.000Z',
      attributes: {
        outcome: 'success',
      },
    });

    expect(bridge.recordEvent).toHaveBeenCalledWith('navigation.completed', {
      outcome: 'success',
    });
    expect(bridge.recordError).not.toHaveBeenCalled();
  });

  it('adapts error records to the bridge error API', () => {
    const bridge: OpenTelemetryBridge = {
      recordEvent: vi.fn(),
      recordError: vi.fn(),
    };
    const exporter = new OpenTelemetryTelemetryExporter(bridge);

    exporter.export({
      kind: 'error',
      name: 'application.error',
      errorType: 'TypeError',
      timestamp: '2026-10-04T00:00:00.000Z',
      attributes: {
        source: 'global',
      },
    });

    expect(bridge.recordError).toHaveBeenCalledWith('application.error', 'TypeError', {
      source: 'global',
    });
  });
});
