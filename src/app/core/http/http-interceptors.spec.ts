import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiError } from './api-error';
import {
  CORRELATION_ID_HEADER,
  correlationIdInterceptor,
} from './correlation-id.interceptor';
import { httpErrorInterceptor } from './http-error.interceptor';

describe('HTTP interceptors', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([correlationIdInterceptor, httpErrorInterceptor]),
        ),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('adds a correlation ID to outgoing requests', () => {
    httpClient.get('/api/examples').subscribe();

    const request = httpTestingController.expectOne('/api/examples');

    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toBeTruthy();

    request.flush([]);
  });

  it('preserves a caller-provided correlation ID', () => {
    httpClient
      .get('/api/examples', {
        headers: {
          [CORRELATION_ID_HEADER]: 'caller-correlation',
        },
      })
      .subscribe();

    const request = httpTestingController.expectOne('/api/examples');

    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toBe(
      'caller-correlation',
    );

    request.flush([]);
  });

  it('maps Problem Details responses to ApiError', () => {
    let receivedError: unknown;

    httpClient.get('/api/examples').subscribe({
      error: (error: unknown) => {
        receivedError = error;
      },
    });

    const request = httpTestingController.expectOne('/api/examples');

    request.flush(
      {
        type: 'https://example.test/problems/validation',
        title: 'Validation failed',
        status: 422,
        detail: 'The request is invalid.',
        correlationId: 'problem-correlation',
      },
      {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {
          [CORRELATION_ID_HEADER]: 'response-correlation',
        },
      },
    );

    expect(receivedError).toBeInstanceOf(ApiError);

    const apiError = receivedError as ApiError;
    expect(apiError.status).toBe(422);
    expect(apiError.message).toBe('The request is invalid.');
    expect(apiError.correlationId).toBe('response-correlation');
    expect(apiError.problemDetails?.title).toBe('Validation failed');
  });
});
