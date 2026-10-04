import { sanitizeTelemetryAttributes } from './telemetry-sanitizer';

describe('sanitizeTelemetryAttributes', () => {
  it('removes attributes whose keys are likely to contain secrets or PII', () => {
    const result = sanitizeTelemetryAttributes({
      route: '/example',
      authorization: 'Bearer secret',
      accessToken: 'token-value',
      email: 'person@example.test',
      requestBody: '{"password":"secret"}',
    });

    expect(result).toEqual({
      route: '/example',
    });
  });

  it('redacts obvious credential or PII-shaped string values', () => {
    expect(
      sanitizeTelemetryAttributes({
        first: 'Bearer abc',
        second: 'aaa.bbb.ccc',
        third: 'person@example.test',
      }),
    ).toEqual({
      first: '[redacted]',
      second: '[redacted]',
      third: '[redacted]',
    });
  });

  it('limits long string attributes', () => {
    const value = 'x'.repeat(300);

    expect(String(sanitizeTelemetryAttributes({ value }).value)).toHaveLength(256);
  });
});
