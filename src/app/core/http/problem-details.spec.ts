import { isProblemDetails } from './problem-details';

describe('isProblemDetails', () => {
  it('accepts Problem Details with correctly typed standard members', () => {
    expect(
      isProblemDetails({
        type: 'https://example.test/problems/validation',
        title: 'Validation failed',
        status: 422,
        detail: 'The request is invalid.',
        instance: '/requests/123',
        traceId: 'trace-123',
      }),
    ).toBe(true);
  });

  it('rejects error envelopes with incompatible standard member types', () => {
    expect(
      isProblemDetails({
        status: '422',
        detail: 'Validation failed',
      }),
    ).toBe(false);
  });

  it('rejects objects that do not contain any standard Problem Details members', () => {
    expect(
      isProblemDetails({
        error: 'Validation failed',
      }),
    ).toBe(false);
  });
});
