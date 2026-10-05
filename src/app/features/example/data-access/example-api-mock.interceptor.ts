import {
  HttpErrorResponse,
  HttpHeaders,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { of, throwError } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import { CORRELATION_ID_HEADER } from '../../../core/http/correlation-id.interceptor';
import { CreateExampleItemDto } from './example-api.dto';
import { ExampleApiMockStore } from './example-api-mock.store';

export const exampleApiMockInterceptor: HttpInterceptorFn = (request, next) => {
  const apiConfig = inject(API_CONFIG);

  if (apiConfig.mode !== 'mock') {
    return next(request);
  }

  const collectionUrl = `${apiConfig.basePath}/examples`;

  if (request.url !== collectionUrl) {
    return next(request);
  }

  const correlationId = request.headers.get(CORRELATION_ID_HEADER) ?? 'local-mock';
  const headers = new HttpHeaders({
    [CORRELATION_ID_HEADER]: correlationId,
  });
  const store = inject(ExampleApiMockStore);

  if (request.method === 'GET') {
    return of(
      new HttpResponse({
        status: 200,
        body: store.list(),
        headers,
        url: request.urlWithParams,
      }),
    );
  }

  if (request.method === 'POST') {
    if (!isCreateRequest(request.body)) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            headers,
            url: request.urlWithParams,
            error: {
              type: 'https://angular-template.local/problems/validation',
              title: 'Validation failed',
              status: 400,
              detail: 'The example name is required.',
              correlationId,
            },
          }),
      );
    }

    return of(
      new HttpResponse({
        status: 201,
        body: store.create(request.body),
        headers,
        url: request.urlWithParams,
      }),
    );
  }

  return next(request);
};

function isCreateRequest(value: unknown): value is CreateExampleItemDto {
  if (typeof value !== 'object' || value === null || !('name' in value)) {
    return false;
  }

  const name = value.name;

  return typeof name === 'string' && name.trim().length > 0;
}
