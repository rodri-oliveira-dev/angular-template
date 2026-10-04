import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { mapHttpError } from './api-error';
import { CORRELATION_ID_HEADER } from './correlation-id.interceptor';

describe('mapHttpError', () => {
  it('uses Problem Details extensions when the response header is absent', () => {
    const error = new HttpErrorResponse({
      status: 409,
      statusText: 'Conflict',
      error: {
        title: 'Conflict',
        status: 409,
        detail: 'The resource changed.',
        traceId: 'trace-409',
      },
    });

    const result = mapHttpError(error);

    expect(result.status).toBe(409);
    expect(result.message).toBe('The resource changed.');
    expect(result.correlationId).toBe('trace-409');
  });

  it('prefers the response correlation header over Problem Details extensions', () => {
    const error = new HttpErrorResponse({
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: new HttpHeaders({
        [CORRELATION_ID_HEADER]: 'header-correlation',
      }),
      error: {
        title: 'Validation failed',
        status: 422,
        correlationId: 'body-correlation',
      },
    });

    expect(mapHttpError(error).correlationId).toBe('header-correlation');
  });

  it('does not treat incompatible error envelopes as Problem Details', () => {
    const error = new HttpErrorResponse({
      status: 422,
      statusText: 'Unprocessable Entity',
      error: {
        status: '422',
        detail: 'JSON:API-style status value',
      },
    });

    const result = mapHttpError(error);

    expect(result.status).toBe(422);
    expect(result.problemDetails).toBeUndefined();
  });

  it('uses a stable message for network failures', () => {
    const error = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
      error: new ProgressEvent('error'),
    });

    expect(mapHttpError(error).message).toBe('Unable to reach the server.');
  });
});
