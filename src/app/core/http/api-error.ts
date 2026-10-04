import { HttpErrorResponse } from '@angular/common/http';

import { CORRELATION_ID_HEADER } from './correlation-id.interceptor';
import { isProblemDetails, ProblemDetails } from './problem-details';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly problemDetails?: ProblemDetails,
    readonly correlationId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function mapHttpError(error: HttpErrorResponse): ApiError {
  const problemDetails = isProblemDetails(error.error) ? error.error : undefined;
  const correlationId =
    error.headers.get(CORRELATION_ID_HEADER) ??
    readStringExtension(problemDetails, 'correlationId') ??
    readStringExtension(problemDetails, 'traceId');

  const message =
    problemDetails?.detail ??
    problemDetails?.title ??
    (error.status === 0 ? 'Unable to reach the server.' : error.message);

  return new ApiError(
    message,
    problemDetails?.status ?? error.status,
    problemDetails,
    correlationId ?? undefined,
  );
}

function readStringExtension(
  problemDetails: ProblemDetails | undefined,
  key: string,
): string | null {
  const value = problemDetails?.[key];

  return typeof value === 'string' && value.length > 0 ? value : null;
}
