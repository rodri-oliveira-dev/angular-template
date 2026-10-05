import {
  HttpXsrfTokenExtractor,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

import { provideApiConfig } from '../../../core/config/api.config';
import { ApiError } from '../../../core/http/api-error';
import {
  CORRELATION_ID_HEADER,
  correlationIdInterceptor,
} from '../../../core/http/correlation-id.interceptor';
import { httpErrorInterceptor } from '../../../core/http/http-error.interceptor';
import {
  HTTP_TELEMETRY_EVENT,
  httpTelemetryInterceptor,
} from '../../../core/http/http-telemetry.interceptor';
import {
  BFF_XSRF_HEADER_NAME,
  bffXsrfFeature,
} from '../../../core/security/bff-session-security';
import { TelemetryClient } from '../../../core/telemetry/telemetry.client';
import { ExampleApiClient } from './example-api-client';
import { exampleApiMockInterceptor } from './example-api-mock.interceptor';

describe('Example BFF contract', () => {
  let client: ExampleApiClient;
  let httpTestingController: HttpTestingController;
  let telemetry: {
    event: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    telemetry = {
      event: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideApiConfig({
          basePath: '/api',
          mode: 'bff',
        }),
        provideHttpClient(
          bffXsrfFeature,
          withInterceptors([
            correlationIdInterceptor,
            httpTelemetryInterceptor,
            httpErrorInterceptor,
            exampleApiMockInterceptor,
          ]),
        ),
        provideHttpClientTesting(),
        {
          provide: HttpXsrfTokenExtractor,
          useValue: {
            getToken: () => 'bff-xsrf-token',
          },
        },
        {
          provide: TelemetryClient,
          useValue: telemetry,
        },
      ],
    });

    client = TestBed.inject(ExampleApiClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('uses the BFF collection contract and preserves response correlation telemetry', async () => {
    const resultPromise = firstValueFrom(client.list());
    const request = httpTestingController.expectOne('/api/examples');

    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toBeTruthy();
    expect(request.request.headers.has(BFF_XSRF_HEADER_NAME)).toBe(false);

    request.flush(
      [
        {
          id: 'bff-1',
          name: 'BFF item',
        },
      ],
      {
        headers: {
          [CORRELATION_ID_HEADER]: 'bff-response-correlation',
        },
      },
    );

    await expect(resultPromise).resolves.toEqual([
      {
        id: 'bff-1',
        label: 'BFF item',
      },
    ]);

    expect(telemetry.event).toHaveBeenCalledWith(
      HTTP_TELEMETRY_EVENT,
      expect.objectContaining({
        method: 'GET',
        status: 200,
        outcome: 'success',
        correlationId: 'bff-response-correlation',
      }),
    );
  });

  it('adds XSRF to BFF writes and preserves Problem Details as ApiError', async () => {
    const resultPromise = firstValueFrom(client.create('BFF write'));
    const request = httpTestingController.expectOne('/api/examples');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'BFF write',
    });
    expect(request.request.headers.get(BFF_XSRF_HEADER_NAME)).toBe('bff-xsrf-token');
    expect(request.request.withCredentials).toBe(false);

    request.flush(
      {
        type: 'https://example.test/problems/conflict',
        title: 'Conflict',
        status: 409,
        detail: 'The BFF rejected the write.',
        traceId: 'bff-trace-409',
      },
      {
        status: 409,
        statusText: 'Conflict',
      },
    );

    await expect(resultPromise).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: 'The BFF rejected the write.',
      correlationId: 'bff-trace-409',
    } satisfies Partial<ApiError>);

    expect(telemetry.event).toHaveBeenCalledWith(
      HTTP_TELEMETRY_EVENT,
      expect.objectContaining({
        method: 'POST',
        status: 409,
        outcome: 'error',
        correlationId: 'bff-trace-409',
      }),
    );
    expect(telemetry.error).not.toHaveBeenCalled();
  });
});
