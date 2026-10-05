import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

export type ApiMode = 'mock' | 'bff';

export interface ApiConfig {
  readonly basePath: string;
  readonly mode: ApiMode;
}

export const DEFAULT_BFF_BASE_PATH = '/api';

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');

export function provideApiConfig(config: ApiConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: API_CONFIG,
      useValue: normalizeApiConfig(config),
    },
  ]);
}

export function normalizeApiConfig(config: ApiConfig): ApiConfig {
  return {
    ...config,
    basePath: normalizeSameOriginBasePath(config.basePath),
  };
}

export function normalizeSameOriginBasePath(basePath: string): string {
  const value = basePath.trim();

  if (
    value.length < 2 ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('?') ||
    value.includes('#')
  ) {
    throw new Error(
      'API basePath must be a same-origin application path such as /api; absolute URLs are not allowed.',
    );
  }

  return value.replace(/\/+$/, '');
}
