import { HttpInterceptorFn } from '@angular/common/http';

export const CORRELATION_ID_HEADER = 'X-Correlation-ID';

export const correlationIdInterceptor: HttpInterceptorFn = (request, next) => {
  const correlationId =
    request.headers.get(CORRELATION_ID_HEADER) ?? createCorrelationId();

  return next(
    request.clone({
      setHeaders: {
        [CORRELATION_ID_HEADER]: correlationId,
      },
    }),
  );
};

export function createCorrelationId(
  randomUUID: (() => string) | null = globalThis.crypto?.randomUUID?.bind(
    globalThis.crypto,
  ) ?? null,
): string {
  if (randomUUID) {
    return randomUUID();
  }

  return `corr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
