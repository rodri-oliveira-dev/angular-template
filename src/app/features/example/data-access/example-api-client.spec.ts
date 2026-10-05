import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { provideApiConfig } from '../../../core/config/api.config';
import { ApiError } from '../../../core/http/api-error';
import {
  CORRELATION_ID_HEADER,
  correlationIdInterceptor,
} from '../../../core/http/correlation-id.interceptor';
import { httpErrorInterceptor } from '../../../core/http/http-error.interceptor';
import { ExampleApiClient } from './example-api-client';

describe('ExampleApiClient', () => {
  let client: ExampleApiClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideApiConfig({
          basePath: '/api',
          mode: 'bff',
        }),
        provideHttpClient(withInterceptors([correlationIdInterceptor, httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    client = TestBed.inject(ExampleApiClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('maps GET transport DTOs to feature models', () => {
    let result: readonly { id: string; label: string }[] | undefined;

    client.list().subscribe((items) => {
      result = items;
    });

    const request = httpTestingController.expectOne('/api/examples');

    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toBeTruthy();

    request.flush([
      {
        id: 'example-1',
        name: 'Mapped from the API',
      },
    ]);

    expect(result).toEqual([
      {
        id: 'example-1',
        label: 'Mapped from the API',
      },
    ]);
  });

  it('sends a write request and maps the created item', () => {
    let result: { id: string; label: string } | undefined;

    client.create('Created through data-access').subscribe((item) => {
      result = item;
    });

    const request = httpTestingController.expectOne('/api/examples');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Created through data-access',
    });

    request.flush({
      id: 'example-3',
      name: 'Created through data-access',
    });

    expect(result).toEqual({
      id: 'example-3',
      label: 'Created through data-access',
    });
  });

  it('surfaces Problem Details as a standardized ApiError', () => {
    let receivedError: unknown;

    client.list().subscribe({
      error: (error: unknown) => {
        receivedError = error;
      },
    });

    const request = httpTestingController.expectOne('/api/examples');

    request.flush(
      {
        type: 'https://example.test/problems/service-unavailable',
        title: 'Service unavailable',
        status: 503,
        detail: 'Try again later.',
      },
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          [CORRELATION_ID_HEADER]: 'request-123',
        },
      },
    );

    expect(receivedError).toBeInstanceOf(ApiError);

    const apiError = receivedError as ApiError;
    expect(apiError.status).toBe(503);
    expect(apiError.message).toBe('Try again later.');
    expect(apiError.correlationId).toBe('request-123');
  });
});
