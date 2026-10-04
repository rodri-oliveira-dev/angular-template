import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, tap } from 'rxjs';

import { TelemetryClient } from '../telemetry/telemetry.client';
import { TelemetryAttributes } from '../telemetry/telemetry.types';
import { ApiError } from './api-error';
import { CORRELATION_ID_HEADER } from './correlation-id.interceptor';

export const HTTP_TELEMETRY_EVENT = 'http.client.request';

export const httpTelemetryInterceptor: HttpInterceptorFn = (request, next) => {
  const telemetry = inject(TelemetryClient);
  const startedAt = nowMilliseconds();
  const requestCorrelationId = request.headers.get(CORRELATION_ID_HEADER) ?? undefined;
  let recorded = false;

  const record = (
    outcome: 'success' | 'error' | 'cancelled',
    status?: number,
    correlationId?: string,
  ): void => {
    if (recorded) {
      return;
    }

    recorded = true;

    const attributes: TelemetryAttributes = {
      method: request.method,
      outcome,
      durationMs: Math.max(0, Math.round(nowMilliseconds() - startedAt)),
      status,
      correlationId,
    };

    telemetry.event(HTTP_TELEMETRY_EVENT, attributes);
  };

  return next(request).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          record(
            'success',
            event.status,
            event.headers.get(CORRELATION_ID_HEADER) ?? requestCorrelationId,
          );
        }
      },
      error: (error: unknown) => {
        if (error instanceof ApiError) {
          record('error', error.status, error.correlationId ?? requestCorrelationId);
          return;
        }

        record('error', undefined, requestCorrelationId);
      },
    }),
    finalize(() => {
      if (!recorded) {
        record('cancelled', undefined, requestCorrelationId);
      }
    }),
  );
};

function nowMilliseconds(): number {
  return globalThis.performance?.now?.() ?? Date.now();
}
