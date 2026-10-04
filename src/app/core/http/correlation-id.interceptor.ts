import { HttpInterceptorFn } from '@angular/common/http';

export const CORRELATION_ID_HEADER = 'X-Correlation-ID';

export const correlationIdInterceptor: HttpInterceptorFn = (request, next) => {
  const correlationId =
    request.headers.get(CORRELATION_ID_HEADER) ?? globalThis.crypto.randomUUID();

  return next(
    request.clone({
      setHeaders: {
        [CORRELATION_ID_HEADER]: correlationId,
      },
    }),
  );
};
