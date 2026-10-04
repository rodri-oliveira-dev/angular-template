import { createCorrelationId } from './correlation-id.interceptor';

describe('createCorrelationId', () => {
  it('uses crypto.randomUUID when available', () => {
    expect(createCorrelationId(() => 'secure-id')).toBe('secure-id');
  });

  it('falls back to a compatible correlation ID when randomUUID is unavailable', () => {
    expect(() => createCorrelationId(undefined)).not.toThrow();
    expect(createCorrelationId(undefined)).toMatch(/^corr-[a-z0-9]+-[a-z0-9]+$/);
  });
});
