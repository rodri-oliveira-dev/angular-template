import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { TelemetryClient } from '../telemetry/telemetry.client';
import { ApiError } from './api-error';
import { CORRELATION_ID_HEADER, correlationIdInterceptor } from './correlation-id.interceptor';
import { httpErrorInterceptor } from './http-error.interceptor';
import { HTTP_TELEMETRY_EVENT, httpTelemetryInterceptor } from './http-telemetry.interceptor';

describe('httpTelemetryInterceptor', () => {
  let httpClient: HttpClient;
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
        provideHttpClient(
          withInterceptors([
            correlationIdInterceptor,
            httpTelemetryInterceptor,
            httpErrorInterceptor,
          ]),
        ),
        provideHttpClientTesting(),
        {
          provide: TelemetryClient,
          useValue: telemetry,
        },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('records successful HTTP duration, status, method, and response correlation', () => {
    httpClient.get('/api/examples?access_token=must-not-leak').subscribe();

    const request = httpTestingController.expectOne(
      '/api/examples?access_token=must-not-leak',
    );

    request.flush([], {
      status: 200,
      statusText: 'OK',
      headers: {
        [CORRELATION_ID_HEADER]: 'response-correlation',
      },
    });

    expect(telemetry.event).toHaveBeenCalledTimes(1);
    expect(telemetry.event).toHaveBeenCalledWith(
      HTTP_TELEMETRY_EVENT,
      expect.objectContaining({
        method: 'GET',
        status: 200,
        outcome: 'success',
        correlationId: 'response-correlation',
        durationMs: expect.any(Number),
      }),
    );

    expect(JSON.stringify(telemetry.event.mock.calls)).not.toContain('must-not-leak');
    expect(telemetry.error).not.toHaveBeenCalled();
  });

  it('records a normalized HTTP failure exactly once without duplicating error telemetry', () => {
    let receivedError: unknown;

    httpClient
      .post('/api/examples?token=query-secret', {
        password: 'body-secret',
      })
      .subscribe({
        error: (error: unknown) => {
          receivedError = error;
        },
      });

    const request = httpTestingController.expectOne('/api/examples?token=query-secret');

    request.flush(
      {
        title: 'Service unavailable',
        status: 503,
        detail: 'Try again later.',
      },
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          [CORRELATION_ID_HEADER]: 'failure-correlation',
        },
      },
    );

    expect(receivedError).toBeInstanceOf(ApiError);
    expect(telemetry.event).toHaveBeenCalledTimes(1);
    expect(telemetry.event).toHaveBeenCalledWith(
      HTTP_TELEMETRY_EVENT,
      expect.objectContaining({
        method: 'POST',
        status: 503,
        outcome: 'error',
        correlationId: 'failure-correlation',
        durationMs: expect.any(Number),
      }),
    );

    const serializedCalls = JSON.stringify(telemetry.event.mock.calls);
    expect(serializedCalls).not.toContain('query-secret');
    expect(serializedCalls).not.toContain('body-secret');
    expect(telemetry.error).not.toHaveBeenCalled();
  });

  it('falls back to the outgoing correlation ID when the response does not provide one', () => {
    httpClient
      .get('/api/examples', {
        headers: {
          [CORRELATION_ID_HEADER]: 'caller-correlation',
        },
      })
      .subscribe();

    const request = httpTestingController.expectOne('/api/examples');
    request.flush([]);

    expect(telemetry.event).toHaveBeenCalledWith(
      HTTP_TELEMETRY_EVENT,
      expect.objectContaining({
        correlationId: 'caller-correlation',
      }),
    );
  });
});
