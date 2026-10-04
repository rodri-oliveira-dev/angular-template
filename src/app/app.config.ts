import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideApiConfig } from './core/config/api.config';
import { correlationIdInterceptor } from './core/http/correlation-id.interceptor';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';
import { exampleApiMockInterceptor } from './features/example/data-access/example-api-mock.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideApiConfig({
      basePath: '/api',
      useLocalMock: true,
    }),
    provideHttpClient(
      withInterceptors([correlationIdInterceptor, httpErrorInterceptor, exampleApiMockInterceptor]),
    ),
  ],
};
