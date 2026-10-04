import { LocalTelemetryClient } from './local-telemetry.client';

describe('LocalTelemetryClient', () => {
  it('records structured events using sanitized attributes', () => {
    const client = new LocalTelemetryClient();

    client.event('example.loaded', {
      route: '/example',
      token: 'must-not-be-recorded',
    });

    expect(client.snapshot()).toEqual([
      expect.objectContaining({
        kind: 'event',
        name: 'example.loaded',
        attributes: {
          route: '/example',
        },
      }),
    ]);
  });

  it('records only the error type and safe context', () => {
    const client = new LocalTelemetryClient();

    client.error(new TypeError('sensitive message'), {
      source: 'global',
      email: 'person@example.test',
    });

    expect(client.snapshot()).toEqual([
      expect.objectContaining({
        kind: 'error',
        name: 'application.error',
        errorType: 'TypeError',
        attributes: {
          source: 'global',
        },
      }),
    ]);

    expect(JSON.stringify(client.snapshot())).not.toContain('sensitive message');
  });

  it('keeps only the configured number of local records', () => {
    const client = new LocalTelemetryClient(2);

    client.event('first');
    client.event('second');
    client.event('third');

    expect(client.snapshot().map((record) => record.name)).toEqual(['second', 'third']);
  });
});
