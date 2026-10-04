import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideApiConfig } from './core/config/api.config';
import { correlationIdInterceptor } from './core/http/correlation-id.interceptor';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';
import { httpTelemetryInterceptor } from './core/http/http-telemetry.interceptor';
import { TelemetryErrorHandler } from './core/telemetry/telemetry-error-handler';
import { providePerformanceTelemetry } from './core/telemetry/performance-telemetry.provider';
import { provideTelemetry } from './core/telemetry/telemetry.provider';
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
    provideTelemetry({
      enabled: true,
      mode: 'local',
      localBufferSize: 100,
      performance: {
        enabled: true,
        navigation: true,
        webVitals: true,
      },
    }),
    providePerformanceTelemetry(),
    {
      provide: ErrorHandler,
      useClass: TelemetryErrorHandler,
    },
    provideHttpClient(
      withInterceptors([
        correlationIdInterceptor,
        httpTelemetryInterceptor,
        httpErrorInterceptor,
        exampleApiMockInterceptor,
      ]),
    ),
  ],
};
